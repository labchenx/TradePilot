import Decimal from 'decimal.js';

export interface MarketQuote {
  symbol: string;
  providerSymbol: string;
  name?: string;
  price: Decimal;
  currency: string;
  provider: 'EASTMONEY';
  source: 'LIVE' | 'CACHE';
  fetchedAt: Date;
}

export interface MarketQuoteResult {
  quotesBySymbol: Map<string, MarketQuote>;
  warnings: string[];
}
