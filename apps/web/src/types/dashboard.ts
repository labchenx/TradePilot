import type { Transaction } from './transaction';

export interface DashboardStat {
  label: string;
  value: number | null;
  currency?: string;
  percent?: boolean;
  positive?: boolean;
  subtitle?: string;
  tooltip?: string;
}

export interface PerformancePoint {
  date: string;
  value: number | null;
  netDeposit?: number;
  stockMarketValue?: number | null;
  cashBalance?: number;
  debug?: AssetTrendPointDebugApiDto;
  warnings?: string[];
}

export type AssetTrendRange = '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

export interface AllocationItem {
  symbol: string;
  name?: string;
  quantity?: number;
  value: number | null;
  color: string;
  isCash?: boolean;
  missingQuote?: boolean;
}

export interface SyncStatus {
  title: string;
  timestamp: string;
  importedRecords: number;
  duplicatesSkipped: number;
  failedRecords: number;
}

export interface ReturnBreakdownItem {
  label: string;
  value: number | null;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface RealizedPnlBySymbolItem {
  symbol: string;
  initials: string;
  remainingQuantity: number;
  value: number;
  returnRate: number;
}

export interface DashboardData {
  stats: DashboardStat[];
  performance: PerformancePoint[];
  allocation: AllocationItem[];
  returnBreakdown: ReturnBreakdownItem[];
  realizedPnlBySymbol: RealizedPnlBySymbolItem[];
  recentTransactions: Transaction[];
  warnings?: string[];
}

export interface DashboardSummaryApiDto {
  totalAssets: number | null;
  stockMarketValue: number | null;
  cashBalance: number;
  accruedDividend?: number;
  netDeposit: number;
  totalPnl: number | null;
  totalReturn?: number | null;
  returnRate: number | null;
  realizedPnl: number;
  realizedNetIncome: number;
  estimated: {
    stockMarketValue: boolean;
    totalAssets: boolean;
    totalPnl: boolean;
    returnRate: boolean;
  };
  currencyBreakdown?: DashboardCurrencyBreakdownApiDto[];
  exchangeRate?: {
    baseCurrency: string;
    updatedAt: string;
    source: string;
    rates: Record<string, number>;
  };
  marketData?: {
    provider: 'EASTMONEY';
    missingQuoteSymbols: string[];
  };
  debug?: unknown;
  warnings?: string[];
}

export interface DashboardCurrencyBreakdownApiDto {
  currency: string;
  cashBalance: number;
  netDeposit: number;
  deposit: number;
  withdrawal: number;
  cashBalanceInBaseCurrency: number;
  netDepositInBaseCurrency: number;
}

export interface AssetTrendPointApiDto {
  month: string;
  date?: string;
  totalAssets: number | null;
  stockMarketValue?: number | null;
  cashBalance?: number;
  netDeposit: number;
  totalReturn?: number | null;
  totalPnl: number | null;
  estimated: boolean;
  debug?: AssetTrendPointDebugApiDto;
  warnings?: string[];
}

export interface AssetTrendPointDebugApiDto {
  cashSource: 'IBKR_CASH_REPORT_WITH_DELTA_EVENTS' | 'TRANSACTION_EVENTS_FALLBACK';
  priceSource: 'PRICE_HISTORY_CACHE' | 'PRICE_HISTORY_CACHE_WITH_MISSING';
  missingPriceSymbols: string[];
}

export interface AllocationItemApiDto {
  symbol: string;
  name?: string;
  type: 'STOCK' | 'CASH';
  quantity?: number;
  value: number | null;
  percent: number;
  estimated: boolean;
  missingQuote?: boolean;
  price?: number | null;
}

export interface ReturnBreakdownApiDto {
  realizedPnl: number;
  unrealizedPnl: number | null;
  dividends: number;
  paymentInLieu: number;
  feesAndTaxes: number;
  total: number | null;
}

export interface RealizedPnlBySymbolApiDto {
  symbol: string;
  realizedPnl: number;
  realizedPnlPercent: number;
  totalSellProceeds: number;
  totalAllocatedCost: number;
  soldQuantity: number;
  remainingQuantity: number;
  remainingCost: number;
  averageCost: number;
  tradeCount: number;
  method: 'IBKR' | 'FIFO';
}

export interface RecentTradeApiDto {
  date: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  commission: number;
}
