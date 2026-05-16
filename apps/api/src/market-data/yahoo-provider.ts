import { Injectable } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';

export interface YahooQuote {
  symbol?: string;
  regularMarketPrice?: number;
  currency?: string;
  shortName?: string;
}

export type YahooQuoteResponseObject = Record<string, YahooQuote>;

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
}
