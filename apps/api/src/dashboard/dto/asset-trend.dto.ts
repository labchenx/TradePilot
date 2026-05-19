export type AssetTrendRange = '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

export const assetTrendRanges: AssetTrendRange[] = [
  '1M',
  '3M',
  'YTD',
  '1Y',
  'ALL',
];

export interface AssetTrendPointDto {
  month: string;
  date?: string;
  totalAssets: number | null;
  stockMarketValue?: number | null;
  cashBalance?: number;
  netDeposit: number;
  totalReturn?: number | null;
  totalPnl: number | null;
  estimated: boolean;
  debug?: {
    cashSource: 'IBKR_CASH_REPORT_WITH_DELTA_EVENTS' | 'TRANSACTION_EVENTS_FALLBACK';
    priceSource: 'PRICE_HISTORY_CACHE' | 'PRICE_HISTORY_CACHE_WITH_MISSING';
    missingPriceSymbols: string[];
  };
  warnings?: string[];
}
