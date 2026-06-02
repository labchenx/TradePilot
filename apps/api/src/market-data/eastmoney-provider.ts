import { Injectable, Logger } from '@nestjs/common';
import {
  EastMoneyMarket,
  EastMoneyProviderSymbol,
} from './symbol-normalizer';

export interface EastMoneyQuote {
  symbol?: string;
  latestPrice?: number;
  currency?: string;
  name?: string;
  market?: number;
  rawData?: unknown;
}

export type EastMoneyQuoteResponseObject = Record<string, EastMoneyQuote>;

export interface EastMoneyDailyPrice {
  date: Date;
  close: number;
  adjustedClose?: number;
  currency: string;
}

/** 新浪财经实时行情 API */
const SINA_QUOTE_URL = 'https://hq.sinajs.cn/list=';

/** 新浪 A 股 + 港股历史 K 线 API */
const SINA_KLINE_CN_URL =
  'https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData';

/**
 * Tencent US daily K-line API.
 *
 * Sina live quotes work for US symbols, but its US historical K-line endpoint
 * currently returns an error object instead of daily rows. Keep the fallback
 * inside this provider so the rest of the market-data pipeline stays unchanged.
 */
const TENCENT_US_KLINE_URL =
  'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get';
const TENCENT_US_QUOTE_URL = 'https://qt.gtimg.cn/q=';
const TENCENT_US_MARKET_SUFFIXES = ['N', 'OQ', 'AM'] as const;

/** 每批最多请求的股票数，避免 URL 过长 */
const BATCH_SIZE = 20;

/**
 * 将 EastMoney 市场码映射为新浪符号，支持多个候选格式。
 * 美股 B 类股（如 BRK.B）Sina 可能用 dot 或 underscore，逐个尝试。
 *
 *  0  → sz   (深圳)
 *  1  → sh   (上海)
 * 105 → gb_  (美股)
 * 106 → gb_  (美股 NYSE)
 * 107 → gb_  (美股 ETF)
 * 116 → hk   (港股)
 */
function toSinaSymbolCandidates(symbol: EastMoneyProviderSymbol): string[] {
  const code = symbol.providerSymbol.toLowerCase();

  switch (symbol.market) {
    case EastMoneyMarket.Shenzhen:
      return [`sz${code}`];
    case EastMoneyMarket.Shanghai:
      return [`sh${code}`];
    case EastMoneyMarket.HongKong:
      return [`hk${code}`];
    case EastMoneyMarket.US:
    case EastMoneyMarket.US_NYSE:
    case EastMoneyMarket.US_ETF:
    default: {
      const candidates = [`gb_${code}`];
      // 美股 B 类股：TradePilot 用下划线 (BRK_B)，Sina 可能用点或下划线
      if (/_b$/i.test(code)) {
        candidates.push(`gb_${code.replace(/_b$/i, '.b')}`);
        candidates.push(`gb_${code.replace(/_b$/i, 'b')}`);
      }
      return candidates;
    }
  }
}

/**
 * 判断是否为美股市场。
 */
function isUsMarket(market: EastMoneyMarket): boolean {
  return (
    market === EastMoneyMarket.US ||
    market === EastMoneyMarket.US_NYSE ||
    market === EastMoneyMarket.US_ETF
  );
}

/**
 * 新浪实时行情返回的 JS-var 格式：
 *   var hq_str_gb_aapl="苹果,150.25,1.55,2026-06-01 16:00:00,148.00,...";
 *
 * 美股字段（gb_）：
 *   0:名称 1:最新价 2:涨跌额 3:涨跌幅 4:日期时间 5:开盘 6:最高 7:最低 8:成交量
 *
 * A 股字段（sh/sz）：
 *   0:名称 1:今开 2:昨收 3:最新价 4:最高 5:最低 6:涨跌额 7:涨跌幅 ... 8:成交量(手)
 *
 * 港股字段（hk）：
 *   0:英文名 1:中文名 2:最新价 3:涨跌额 4:涨跌幅 5:开盘 6:最高 7:最低 8:昨收 ...
 */
function parseSinaQuoteLine(line: string): {
  name: string;
  price: number;
} | null {
  // 提取 "..." 中间的内容
  const quoteMatch = line.match(/"([^"]*)"/);
  if (!quoteMatch) return null;

  const fields = quoteMatch[1].split(',');
  if (fields.length < 4) return null;

  const prefix = line.match(/hq_str_([\w.]+)=/)?.at(1) ?? '';

  let name: string;
  let price: number;

  if (prefix.startsWith('gb_')) {
    // 美股: 0=名称, 1=最新价
    name = fields[0];
    price = parseFloat(fields[1]);
  } else if (prefix.startsWith('hk')) {
    // 港股: 1=中文名, 2=最新价
    name = fields[1] || fields[0];
    price = parseFloat(fields[2]);
  } else {
    // A 股 (sh/sz): 0=名称, 3=最新价
    name = fields[0];
    price = parseFloat(fields[3]);
  }

  if (!Number.isFinite(price) || price <= 0) return null;
  return { name, price };
}

/**
 * 新浪历史 K 线返回格式：
 *   [{day:"2026-06-01", open:"148.00", high:"152.75",
 *     low:"147.50", close:"150.25", volume:"24958324"}, ...]
 */
interface SinaKlineItem {
  day: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

type TencentKlineRow = [
  date: string,
  open: string,
  close: string,
  high: string,
  low: string,
  volume?: string,
];

interface TencentKlinePayload {
  code?: number;
  msg?: string;
  data?: Record<
    string,
    {
      day?: TencentKlineRow[];
      qfqday?: TencentKlineRow[];
    }
  >;
}

function parseTencentQuoteLine(line: string): {
  name: string;
  price: number;
  currency: string;
} | null {
  const fields = line.match(/"([^"]*)"/)?.[1]?.split('~') ?? [];
  if (fields.length < 4) return null;

  const price = parseFloat(fields[3]);
  if (!Number.isFinite(price) || price <= 0) return null;

  return {
    name: fields[1],
    price,
    currency: fields.find((field) => /^[A-Z]{3}$/.test(field)) ?? 'USD',
  };
}

@Injectable()
export class EastMoneyProvider {
  private readonly logger = new Logger(EastMoneyProvider.name);

  /**
   * 批量获取实时行情。
   *
   * 新浪财经 hq.sinajs.cn 接口：
   * - 单次 GET 可请求多个股票，逗号分隔
   * - 需要 Referer: https://finance.sina.com.cn
   * - 无 token / cookie 要求，零反爬
   */
  async getQuotes(
    symbols: EastMoneyProviderSymbol[],
  ): Promise<EastMoneyQuoteResponseObject> {
    if (symbols.length === 0) return {};

    // 去重
    const uniqueByKey = new Map<string, EastMoneyProviderSymbol>();
    for (const s of symbols) {
      if (!uniqueByKey.has(s.providerKey)) {
        uniqueByKey.set(s.providerKey, s);
      }
    }
    const unique = Array.from(uniqueByKey.values());

    const result: EastMoneyQuoteResponseObject = {};

    // 分批请求，避免 URL 过长
    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
      const batch = unique.slice(i, i + BATCH_SIZE);
      // 每个股票可能有多个候选 Sina 符号，全部加入请求（Sina 忽略不识别的符号）
      const allCandidates = batch.flatMap((s) =>
        toSinaSymbolCandidates(s).map((c) => ({ symbol: s, sina: c })),
      );
      const sinaSymbols = allCandidates.map((c) => c.sina);
      const url = `${SINA_QUOTE_URL}${sinaSymbols.join(',')}`;

      try {
        const response = await fetch(url, {
          headers: {
            Referer: 'https://finance.sina.com.cn',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          this.logger.warn(`Sina quote request failed: HTTP ${response.status}`);
          continue;
        }

        const text = await response.text();
        const lines = text.split('\n').filter((l) => l.startsWith('var hq_str_'));

        // 构建 sina symbol → line 的映射
        const lineBySina = new Map<string, string>();
        for (const line of lines) {
          const match = line.match(/hq_str_([\w.]+)=/);
          if (match) lineBySina.set(match[1], line);
        }

        // 匹配回 TradePilot symbol
        for (const { symbol, sina } of allCandidates) {
          if (result[symbol.providerKey]) continue; // 已解析成功

          const line = lineBySina.get(sina);
          if (!line) continue;

          const parsed = parseSinaQuoteLine(line);
          if (!parsed) continue;

          result[symbol.providerKey] = {
            symbol: symbol.providerSymbol,
            latestPrice: parsed.price,
            currency: isUsMarket(symbol.market)
              ? 'USD'
              : symbol.market === EastMoneyMarket.HongKong
                ? 'HKD'
                : 'CNY',
            name: parsed.name,
            market: symbol.market,
            rawData: line,
          };
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Sina quote batch failed: ${msg}`);
      }
    }

    const missingUsSymbols = unique.filter(
      (symbol) => isUsMarket(symbol.market) && !result[symbol.providerKey],
    );
    if (missingUsSymbols.length > 0) {
      const tencentQuotes = await this.getTencentUsQuotes(missingUsSymbols);
      Object.assign(result, tencentQuotes);
    }

    this.logger.log(
      `Market quotes: ${Object.keys(result).length}/${unique.length} symbols resolved`,
    );
    return result;
  }

  /**
   * 获取历史日线收盘价。
   *
   * 美股走 US_MarketData 接口，A 股/港股走 CN_MarketData。
   * 对于特殊符号（如 BRK_B），依次尝试多个 Sina 候选格式。
   */
  async getDailyPrices(
    symbol: EastMoneyProviderSymbol,
    period1: Date,
    period2: Date,
  ): Promise<EastMoneyDailyPrice[]> {
    if (isUsMarket(symbol.market)) {
      return this.getTencentUsDailyPrices(symbol, period1, period2);
    }

    for (const sinaSymbol of toSinaSymbolCandidates(symbol)) {
      const params = new URLSearchParams({
        symbol: sinaSymbol,
        scale: '240',
        ma: 'no',
        datalen: '1025',
      });

      try {
        const response = await fetch(`${SINA_KLINE_CN_URL}?${params.toString()}`, {
          headers: {
            Referer: 'https://finance.sina.com.cn',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          this.logger.warn(
            `Sina kline request failed for ${sinaSymbol}: HTTP ${response.status}`,
          );
          continue;
        }

        const raw = (await response.json()) as unknown;

        if (!Array.isArray(raw) || raw.length === 0) {
          this.logger.warn(
            `Sina kline returned no daily rows for ${sinaSymbol}`,
          );
          continue;
        }

        const prices = (raw as SinaKlineItem[])
          .map((item) => {
            const close = parseFloat(item.close);
            return {
              date: new Date(`${item.day}T00:00:00.000Z`),
              close,
              adjustedClose: close,
              currency: isUsMarket(symbol.market)
                ? 'USD'
                : symbol.market === EastMoneyMarket.HongKong
                  ? 'HKD'
                  : 'CNY',
            };
          })
          .filter(
            (item) =>
              Number.isFinite(item.close) &&
              item.date >= period1 &&
              item.date <= period2,
          );

        this.logger.debug(
          `Sina kline for ${sinaSymbol}: ${raw.length} raw → ${prices.length} filtered (${period1.toISOString().slice(0, 10)} ~ ${period2.toISOString().slice(0, 10)})`,
        );

        if (prices.length > 0) return prices;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Sina kline error for ${sinaSymbol}: ${msg}`);
      }
    }

    return [];
  }

  private async getTencentUsQuotes(
    symbols: EastMoneyProviderSymbol[],
  ): Promise<EastMoneyQuoteResponseObject> {
    const result: EastMoneyQuoteResponseObject = {};

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      const candidates = batch.map((symbol) => ({
        symbol,
        tencent: toTencentUsSymbolBase(symbol.providerSymbol),
      }));
      const url = `${TENCENT_US_QUOTE_URL}${candidates
        .map((candidate) => candidate.tencent)
        .join(',')}`;

      try {
        const response = await fetch(url, {
          headers: {
            Referer: 'https://gu.qq.com/',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          this.logger.warn(`Tencent US quote request failed: HTTP ${response.status}`);
          continue;
        }

        const text = await response.text();
        const lines = text.split('\n').filter((line) => line.startsWith('v_'));
        const lineByTencent = new Map<string, string>();

        for (const line of lines) {
          const match = line.match(/^v_([^=]+)=/);
          if (match) lineByTencent.set(match[1], line);
        }

        for (const { symbol, tencent } of candidates) {
          const line = lineByTencent.get(tencent);
          if (!line) continue;

          const parsed = parseTencentQuoteLine(line);
          if (!parsed) continue;

          result[symbol.providerKey] = {
            symbol: symbol.providerSymbol,
            latestPrice: parsed.price,
            currency: parsed.currency,
            name: parsed.name,
            market: symbol.market,
            rawData: {
              source: 'TENCENT_QUOTE',
              line,
            },
          };
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Tencent US quote batch failed: ${msg}`);
      }
    }

    return result;
  }

  private async getTencentUsDailyPrices(
    symbol: EastMoneyProviderSymbol,
    period1: Date,
    period2: Date,
  ): Promise<EastMoneyDailyPrice[]> {
    for (const tencentSymbol of await this.getTencentUsSymbolCandidates(symbol)) {
      const params = new URLSearchParams({
        _var: 'kline_dayqfq',
        param: `${tencentSymbol},day,,,2000,qfq`,
      });

      try {
        const response = await fetch(`${TENCENT_US_KLINE_URL}?${params.toString()}`, {
          headers: {
            Referer: 'https://gu.qq.com/',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          this.logger.warn(
            `Tencent US kline request failed for ${tencentSymbol}: HTTP ${response.status}`,
          );
          continue;
        }

        const payload = parseTencentKlinePayload(await response.text());
        const rows =
          payload.data?.[tencentSymbol]?.qfqday ??
          payload.data?.[tencentSymbol]?.day ??
          [];

        if (rows.length === 0) {
          this.logger.warn(
            `Tencent US kline returned no daily rows for ${tencentSymbol}`,
          );
          continue;
        }

        const prices = rows
          .map((row) => {
            const close = parseFloat(row[2]);
            return {
              date: new Date(`${row[0]}T00:00:00.000Z`),
              close,
              adjustedClose: close,
              currency: 'USD',
            };
          })
          .filter(
            (item) =>
              Number.isFinite(item.close) &&
              item.date >= period1 &&
              item.date <= period2,
          );

        this.logger.debug(
          `Tencent US kline for ${tencentSymbol}: ${rows.length} raw -> ${prices.length} filtered (${period1.toISOString().slice(0, 10)} ~ ${period2.toISOString().slice(0, 10)})`,
        );

        if (prices.length > 0) return prices;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Tencent US kline error for ${tencentSymbol}: ${msg}`);
      }
    }

    return [];
  }

  private async getTencentUsSymbolCandidates(
    symbol: EastMoneyProviderSymbol,
  ): Promise<string[]> {
    const baseSymbol = toTencentUsSymbolBase(symbol.providerSymbol);
    const candidates = new Set<string>();

    const quoteSymbol = await this.resolveTencentUsQuoteSymbol(baseSymbol);
    if (quoteSymbol) {
      candidates.add(quoteSymbol);
    }

    for (const suffix of TENCENT_US_MARKET_SUFFIXES) {
      candidates.add(`${baseSymbol}.${suffix}`);
    }
    candidates.add(baseSymbol);

    return Array.from(candidates);
  }

  private async resolveTencentUsQuoteSymbol(
    baseSymbol: string,
  ): Promise<string | null> {
    try {
      const response = await fetch(`${TENCENT_US_QUOTE_URL}${baseSymbol}`, {
        headers: {
          Referer: 'https://gu.qq.com/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      if (!response.ok) return null;

      const text = await response.text();
      const fields = text.match(/"([^"]*)"/)?.[1]?.split('~') ?? [];
      const marketCode = fields[2];
      return marketCode ? `us${marketCode}` : null;
    } catch {
      return null;
    }
  }
}

function toTencentUsSymbolBase(providerSymbol: string) {
  return `us${providerSymbol.replace(/_/g, '.')}`;
}

function parseTencentKlinePayload(text: string): TencentKlinePayload {
  const jsonText = text
    .trim()
    .replace(/^[\w$]+\s*=\s*/, '')
    .replace(/;$/, '');

  return JSON.parse(jsonText) as TencentKlinePayload;
}
