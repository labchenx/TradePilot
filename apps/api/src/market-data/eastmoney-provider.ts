import { Injectable } from '@nestjs/common';
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
const EASTMONEY_UT = 'a79f54e3d4c8d44e494efb8f748db291';
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
  private crawler?: EastMoneyCrawler;

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

    const params = new URLSearchParams({
      fltt: '2',
      np: '3',
      ut: EASTMONEY_UT,
      invt: '2',
      secids: buildQuoteSecids(symbols).join(','),
      fields: QUOTE_FIELDS,
    });
    const response = await fetch(`${EASTMONEY_QUOTE_URL}?${params.toString()}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://quote.eastmoney.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`EastMoney quote request failed: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as EastMoneyListResponse;
    const rows = payload.data?.diff ?? [];
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
    const prices = await crawler.fetchKlineData({
      symbol: symbol.providerSymbol,
      market: symbol.market as Market,
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
