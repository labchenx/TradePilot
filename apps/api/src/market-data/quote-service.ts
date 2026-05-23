import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { SettingsService } from '../settings/settings.service';
import { QuoteCacheService } from './quote-cache.service';
import { MarketQuote, MarketQuoteResult } from './quote.types';
import { normalizeSymbolForYahoo } from './symbol-normalizer';
import { YahooProvider } from './yahoo-provider';

@Injectable()
export class QuoteService {
  constructor(
    private readonly yahooProvider: YahooProvider,
    private readonly quoteCache: QuoteCacheService,
    private readonly settingsService?: SettingsService,
  ) {}

  /**
   * 批量获取当前行情。
   *
   * 处理顺序：
   * 1. 先请求 Yahoo Finance。
   * 2. 成功拿到的 quote 立即保存一份快照到数据库。
   * 3. 实时行情缺失时，回退到数据库里最近一次成功快照。
   *
   * 这样 Dashboard 依赖外部 API 时会更稳：第三方接口抖动不会直接让资产指标变成空。
   */
  async getCurrentQuotes(
    symbols: string[],
    userId?: string,
  ): Promise<MarketQuoteResult> {
    const uniqueSymbols = Array.from(
      new Set(symbols.map((symbol) => symbol.trim()).filter(Boolean)),
    );
    const providerOverrides =
      await this.settingsService?.resolveProviderSymbols(userId, uniqueSymbols);
    const normalizedByOriginal = new Map(
      uniqueSymbols.map((symbol) => [
        symbol,
        providerOverrides?.get(symbol.trim().toUpperCase()) ??
          normalizeSymbolForYahoo(symbol),
      ]),
    );
    const providerSymbols = Array.from(new Set(normalizedByOriginal.values()));
    const warnings: string[] = [];
    const quotesBySymbol = new Map<string, MarketQuote>();
    const successfulSnapshots: Array<{
      quote: MarketQuote;
      rawData?: unknown;
    }> = [];
    const missingQuoteInputs: Array<{
      symbol: string;
      providerSymbol: string;
    }> = [];

    let rawQuotes: Awaited<ReturnType<YahooProvider['getQuotes']>> = {};

    try {
      rawQuotes = await this.yahooProvider.getQuotes(providerSymbols);
    } catch {
      warnings.push('批量行情请求失败，已按单个股票重试。');

      for (const providerSymbol of providerSymbols) {
        try {
          rawQuotes = {
            ...rawQuotes,
            ...(await this.yahooProvider.getQuotes([providerSymbol])),
          };
        } catch {
          warnings.push(`${providerSymbol} 行情获取失败。`);
        }
      }
    }

    for (const [symbol, providerSymbol] of normalizedByOriginal.entries()) {
      const quote = rawQuotes[providerSymbol];
      const price = quote?.regularMarketPrice;
      const currency = quote?.currency;

      if (typeof price !== 'number' || !Number.isFinite(price) || !currency) {
        missingQuoteInputs.push({ symbol, providerSymbol });
        continue;
      }

      const marketQuote: MarketQuote = {
        symbol,
        providerSymbol,
        name: quote.shortName,
        price: new Decimal(price),
        currency,
        provider: 'YAHOO_FINANCE',
        source: 'LIVE',
        fetchedAt: new Date(),
      };

      quotesBySymbol.set(symbol, marketQuote);
      successfulSnapshots.push({ quote: marketQuote, rawData: quote });
    }

    try {
      await this.quoteCache.saveSnapshots(successfulSnapshots);
    } catch {
      warnings.push(
        '行情已成功获取，但写入本地行情快照失败；本次页面仍使用实时行情。',
      );
    }

    if (missingQuoteInputs.length > 0) {
      const cachedQuotes =
        await this.quoteCache.getLatestQuotes(missingQuoteInputs);

      for (const { symbol } of missingQuoteInputs) {
        const cachedQuote = cachedQuotes.get(symbol);

        if (cachedQuote) {
          quotesBySymbol.set(symbol, cachedQuote);
          warnings.push(
            `${symbol} 实时行情不可用，已使用本地缓存价格（${cachedQuote.fetchedAt.toISOString()}）。`,
          );
          continue;
        }

        warnings.push(
          `${symbol} 缺少可用行情价格，且本地没有缓存快照，Dashboard 已将相关市值指标标记为 --。`,
        );
      }
    }

    return {
      quotesBySymbol,
      warnings,
    };
  }
}
