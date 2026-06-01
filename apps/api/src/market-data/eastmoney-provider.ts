import { Injectable, Logger } from '@nestjs/common';
import type {
  EastMoneyCrawler,
  KlineData,
  Market,
  RealtimeQuote,
} from 'emst';
import {
  EastMoneyMarket,
  EastMoneyProviderSymbol,
  getEastMoneyProviderSymbolCandidates,
} from './symbol-normalizer';

type EmstModule = typeof import('emst');

const importEsm = new Function(
  'moduleName',
  'return import(moduleName)',
) as (moduleName: string) => Promise<EmstModule>;

const EASTMONEY_QUOTE_URL =
  'https://push2.eastmoney.com/api/qt/ulist.np/get';
const QUOTE_FIELDS = [
  'f12',
  'f13',
  'f14',
  'f2',
  'f3',
  'f4',
  'f15',
  'f16',
  'f17',
  'f18',
].join(',');

export interface EastMoneyQuote {
  symbol?: string;
  latestPrice?: number;
  currency?: string;
  name?: string;
  market?: number;
  rawData?: unknown;
}

export type EastMoneyQuoteResponseObject = Record<string, EastMoneyQuote>;

interface EastMoneyListQuote {
  f2?: number;
  f3?: number;
  f4?: number;
  f12?: string;
  f13?: number;
  f14?: string;
  f15?: number;
  f16?: number;
  f17?: number;
  f18?: number;
}

interface EastMoneyListResponse {
  rc: number;
  data?: {
    diff?: EastMoneyListQuote[];
  };
}

export interface EastMoneyDailyPrice {
  date: Date;
  close: number;
  adjustedClose?: number;
  currency: string;
}

@Injectable()
export class EastMoneyProvider {
  private readonly logger = new Logger(EastMoneyProvider.name);
  private crawler?: EastMoneyCrawler;
  private cookieHeader?: string;
  private cachedUtToken?: string;
  private utTokenExpiresAt = 0;

  /**
   * 生成模拟浏览器的追踪 cookie。
   * 东方财富的 API 会检查这些基础 cookie，缺失时可能拒绝请求。
   */
  private generateCookies(): string {
    const now = Date.now();
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');

    return [
      `qgqp_b_id=${randomHex}`,
      `st_si=${now}`,
      `st_pvi=${now}${Math.floor(Math.random() * 1000000)}`,
      `st_sn=1`,
    ].join('; ');
  }

  private getCookies(): string {
    if (!this.cookieHeader) {
      this.cookieHeader = this.generateCookies();
    }
    return this.cookieHeader;
  }

  /**
   * 从东方财富股票页面自动抓取最新的 ut token。
   *
   * 东方财富在每个行情页面的内联脚本中嵌入了当前有效的 ut token，
   * 格式类似 `"ut":"a79f54e3..."` 或 `ut:"a79f54e3..."`。
   *
   * 抓取到的 token 会缓存 30 分钟，避免每次请求都去爬页面。
   */
  private async fetchUtTokenFromPage(): Promise<string | null> {
    // 缓存未过期，直接复用
    if (this.cachedUtToken && Date.now() < this.utTokenExpiresAt) {
      return this.cachedUtToken;
    }

    try {
      this.logger.log('Fetching fresh ut token from EastMoney page...');
      const response = await fetch(
        'https://quote.eastmoney.com/sh000001.html',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(`Failed to fetch EastMoney page for ut token: HTTP ${response.status}`);
        return null;
      }

      const html = await response.text();

      // 尝试多种常见的 token 嵌入模式
      const patterns = [
        /"ut"\s*:\s*"([a-f0-9]{32,})"/i,
        /ut\s*:\s*"([a-f0-9]{32,})"/i,
        /"Ut"\s*:\s*"([a-f0-9]{32,})"/i,
        /var\s+ut\s*=\s*"([a-f0-9]{32,})"/i,
        /window\.ut\s*=\s*"([a-f0-9]{32,})"/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          const token = match[1];
          this.cachedUtToken = token;
          // 缓存 30 分钟
          this.utTokenExpiresAt = Date.now() + 30 * 60 * 1000;
          this.logger.log(`Auto-fetched ut token: ${token.slice(0, 8)}... (cached for 30min)`);
          return token;
        }
      }

      this.logger.warn('Could not find ut token in EastMoney page HTML');
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to auto-fetch ut token: ${message}`);
      return null;
    }
  }

  /**
   * 获取当前可用的 ut token，按优先级：
   * 1. 环境变量 EASTMONEY_UT_TOKEN
   * 2. 从东方财富页面自动抓取（缓存 30 分钟）
   * 3. 内置的候选 token 作为兜底
   * 4. 空字符串（尝试不带 ut 参数请求）
   */
  private async getUtTokens(): Promise<string[]> {
    const envToken = process.env.EASTMONEY_UT_TOKEN;
    if (envToken) {
      return [envToken];
    }

    const tokens: string[] = [];

    // 尝试自动抓取
    const fetched = await this.fetchUtTokenFromPage();
    if (fetched) {
      tokens.push(fetched);
    }

    // 兜底候选
    tokens.push(
      'a79f54e3d4c8d44e494efb8f748db291',
      'b4e4c4e1f7a8d9c0b3e5f6a7d8c9e0f1',
      '32ef71d4f5a6b7c8d9e0f1a2b3c4d5e6',
    );

    // 最后尝试不带 ut
    tokens.push('');

    return tokens;
  }

  /**
   * 这里是第三方行情库的唯一出口。
   * 业务层不要直接依赖 emst，后续替换行情源时只需要改 Provider。
   */
  async getQuotes(
    symbols: EastMoneyProviderSymbol[],
  ): Promise<EastMoneyQuoteResponseObject> {
    if (symbols.length === 0) {
      return {};
    }

    const secids = buildQuoteSecids(symbols).join(',');
    const baseParams: Record<string, string> = {
      fltt: '2',
      np: '3',
      invt: '2',
      secids,
      fields: QUOTE_FIELDS,
    };

    // 依次尝试不同的 ut token（包括不带 ut 的情况）
    const utCandidates = await this.getUtTokens();

    for (const ut of utCandidates) {
      const params = new URLSearchParams(baseParams);
      if (ut) {
        params.set('ut', ut);
      }

      try {
        const result = await this.fetchQuotesWithParams(params, symbols, ut);
        if (result !== null) {
          if (ut) {
            this.logger.log(`Real-time quote batch succeeded with ut=${ut.slice(0, 8)}...`);
          } else {
            this.logger.log('Real-time quote batch succeeded without ut token');
          }
          return result;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Quote attempt ${ut ? `with ut=${ut.slice(0, 8)}...` : 'without ut'} failed: ${message}`,
        );
      }
    }

    // 批量接口完全失败，尝试逐个通过 emst 爬虫获取
    this.logger.warn('Batch quote API failed entirely, falling back to per-symbol crawler...');
    return this.fetchQuotesWithCrawler(symbols);
  }

  /**
   * 用指定参数请求批量行情接口。
   * 返回 null 表示响应有效但数据为空（可能是 token 错误），
   * 抛出异常表示网络/HTTP 层面失败。
   */
  private async fetchQuotesWithParams(
    params: URLSearchParams,
    symbols: EastMoneyProviderSymbol[],
    ut: string,
  ): Promise<EastMoneyQuoteResponseObject | null> {
    const response = await fetch(
      `${EASTMONEY_QUOTE_URL}?${params.toString()}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
          Referer: 'https://quote.eastmoney.com/',
          Cookie: this.getCookies(),
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as EastMoneyListResponse;

    // rc !== 0 表示 API 层面错误（如 token 无效）
    if (payload.rc !== 0) {
      this.logger.warn(`EastMoney quote API returned rc=${payload.rc}${ut ? ` (ut=${ut.slice(0, 8)}...)` : ''}`);
      return null;
    }

    const rows = payload.data?.diff ?? [];
    if (rows.length === 0) {
      // 响应正常但无数据，可能是 token 有效但 secids 不匹配
      return null;
    }

    return this.parseQuoteRows(rows, symbols);
  }

  /**
   * 批量接口彻底失败后的兜底：使用 emst 爬虫逐个获取。
   */
  private async fetchQuotesWithCrawler(
    symbols: EastMoneyProviderSymbol[],
  ): Promise<EastMoneyQuoteResponseObject> {
    const crawler = await this.getCrawler();
    const result: EastMoneyQuoteResponseObject = {};

    for (const symbol of symbols) {
      // 尝试所有候选市场
      for (const candidate of getEastMoneyProviderSymbolCandidates(symbol)) {
        try {
          const market = normalizeMarketForEmst(candidate.market);
          const quote = await crawler.getRealtimeQuote(
            candidate.providerSymbol,
            market as Market,
          );
          result[symbol.providerKey] = {
            symbol: quote.symbol,
            latestPrice: quote.latestPrice,
            currency: inferCurrency(candidate.market),
            name: quote.name,
            market: candidate.market,
            rawData: quote,
          };
          break; // 成功，跳出候选循环
        } catch {
          continue; // 尝试下一个候选市场
        }
      }
    }

    return result;
  }

  /**
   * 将 API 返回的原始 rows 解析为 quote 对象。
   */
  private parseQuoteRows(
    rows: EastMoneyListQuote[],
    symbols: EastMoneyProviderSymbol[],
  ): EastMoneyQuoteResponseObject {
    const byExactKey = new Map(
      rows
        .filter((row) => row.f12 && typeof row.f13 === 'number')
        .map((row) => [`${row.f13}:${row.f12}`, row]),
    );
    const bySymbol = new Map(
      rows.filter((row) => row.f12).map((row) => [row.f12 as string, row]),
    );
    const entries: Array<[string, EastMoneyQuote]> = [];

    for (const symbol of symbols) {
      const row =
        byExactKey.get(symbol.providerKey) ?? bySymbol.get(symbol.providerSymbol);

      if (!row) continue;

      entries.push([
        symbol.providerKey,
        {
          symbol: row.f12,
          latestPrice: row.f2,
          currency: inferCurrency(row.f13 ?? symbol.market),
          name: row.f14,
          market: row.f13,
          rawData: row,
        },
      ]);
    }

    return Object.fromEntries(entries);
  }

  async getDailyPrices(
    symbol: EastMoneyProviderSymbol,
    period1: Date,
    period2: Date,
  ): Promise<EastMoneyDailyPrice[]> {
    const crawler = await this.getCrawler();

    // emst 库的 Market 枚举不含 106 (US_NYSE)，需要映射到 105 (US)
    const market = normalizeMarketForEmst(symbol.market);

    const prices = await crawler.fetchKlineData({
      symbol: symbol.providerSymbol,
      market: market as Market,
      timeframe: 'daily',
      startDate: toEastMoneyDate(period1),
      endDate: toEastMoneyDate(period2),
      fqt: 1,
    });

    return prices
      .filter((price): price is KlineData => typeof price.close === 'number')
      .map((price) => ({
        date: new Date(`${price.date}T00:00:00.000Z`),
        close: price.close,
        adjustedClose: price.close,
        currency: inferCurrency(symbol.market),
      }));
  }

  private async getCrawler() {
    if (!this.crawler) {
      const { EastMoneyCrawler } = await importEsm('emst');
      this.crawler = new EastMoneyCrawler();
    }

    return this.crawler;
  }
}

function buildQuoteSecids(symbols: EastMoneyProviderSymbol[]) {
  return Array.from(
    new Set(
      symbols.flatMap((symbol) =>
        getEastMoneyProviderSymbolCandidates(symbol).map(
          (candidate) => `${candidate.market}.${candidate.providerSymbol}`,
        ),
      ),
    ),
  );
}

/**
 * emst 库的 Market 枚举只支持 0, 1, 105, 107, 116。
 * TradePilot 额外定义了 106 (US_NYSE)，需要映射到 105 (US) 才能让 emst 正常工作。
 */
function normalizeMarketForEmst(market: EastMoneyMarket): number {
  // 106 (US_NYSE) → 105 (US)
  if (market === 106) return EastMoneyMarket.US;
  return market;
}

function toEastMoneyDate(value: Date) {
  return value.toISOString().slice(0, 10).replace(/-/g, '');
}

function inferCurrency(market: Market | number) {
  if (
    market === EastMoneyMarket.US ||
    market === EastMoneyMarket.US_ETF ||
    market === 106
  ) {
    return 'USD';
  }
  if (market === EastMoneyMarket.HongKong) return 'HKD';
  return 'CNY';
}
