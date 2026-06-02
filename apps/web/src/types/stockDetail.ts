import type { HoldingApiDto } from './holding';
import type { PortfolioTransactionApiDto } from './transaction';

export type StockDetailTrendRange = '1M' | '3M' | '6M' | '1Y';

export interface StockPriceTrendPoint {
  date: string;
  price: number;
  currency: string;
  source: 'PRICE_HISTORY' | 'POSITION_SNAPSHOT';
}

export interface StockDetailApiDto {
  symbol: string;
  holding: HoldingApiDto | null;
  priceTrend: StockPriceTrendPoint[];
  transactions: PortfolioTransactionApiDto[];
  warnings: string[];
  updatedAt: string;
}
