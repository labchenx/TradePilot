declare module 'emst' {
  export enum Market {
    Shenzhen = 0,
    Shanghai = 1,
    US = 105,
    US_ETF = 107,
    HongKong = 116,
  }

  export type Timeframe =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | '5min'
    | '15min'
    | '30min'
    | '60min';

  export interface KlineData {
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    amount: number;
    amplitude?: number;
    changePercent?: number;
    changeAmount?: number;
    turnoverRate?: number;
  }

  export interface RealtimeQuote {
    symbol: string;
    name: string;
    market: number;
    latestPrice: number;
    open: number;
    previousClose: number;
    high: number;
    low: number;
    volume: number;
    amount: number;
    changePercent?: number;
    changeAmount?: number;
    totalMarketValue?: number;
    circulatingMarketValue?: number;
    timestamp?: number;
  }

  export class EastMoneyCrawler {
    getRealtimeQuote(symbol: string, market: Market): Promise<RealtimeQuote>;
    fetchKlineData(options: {
      symbol: string;
      market?: Market;
      timeframe?: Timeframe;
      startDate?: string;
      endDate?: string;
      limit?: number;
      fqt?: 0 | 1 | 2;
    }): Promise<KlineData[]>;
  }
}
