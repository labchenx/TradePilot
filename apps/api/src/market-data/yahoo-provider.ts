import { Injectable } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';

export interface YahooQuote {
  symbol?: string;
  regularMarketPrice?: number;
  currency?: string;
  shortName?: string;
}

export type YahooQuoteResponseObject = Record<string, YahooQuote>;

export interface YahooDailyPrice {
  date: Date;
  close: number;
  adjustedClose?: number;
  currency: string;
}

@Injectable()
export class YahooProvider {
  private readonly client = new YahooFinance({
    suppressNotices: ['yahooSurvey'],
  });

  /**
   * 这里是第三方行情库的唯一出口。
   * 业务层不要直接依赖 yahoo-finance2，后续替换行情源时只需要改 Provider。
   */
  async getQuotes(symbols: string[]): Promise<YahooQuoteResponseObject> {
    if (symbols.length === 0) {
      return {};
    }

    return this.client.quote(symbols, {
      return: 'object',
      fields: ['symbol', 'regularMarketPrice', 'currency', 'shortName'],
    }) as Promise<YahooQuoteResponseObject>;
  }

  async getDailyPrices(
    symbol: string,
    period1: Date,
    period2: Date,
  ): Promise<YahooDailyPrice[]> {
    const result = await this.client.chart(symbol, {
      period1,
      period2,
      interval: '1d',
      return: 'array',
    });

    return result.quotes
      .filter((quote) => typeof quote.close === 'number')
      .map((quote) => ({
        date: quote.date,
        close: quote.close as number,
        adjustedClose:
          typeof quote.adjclose === 'number' ? quote.adjclose : undefined,
        currency: result.meta.currency,
      }));
  }
}
