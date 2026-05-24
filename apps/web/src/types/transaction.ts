export type TradeSide = 'BUY' | 'SELL';
export type TradeSource = 'MANUAL' | 'EMAIL' | 'IBKR_CSV' | 'IBKR_EMAIL_PDF';
export type TransactionSideFilter = TradeSide | 'ALL';
export type TransactionSortBy = 'date' | 'amount' | 'realizedPnl' | 'symbol';
export type TransactionSortDirection = 'asc' | 'desc';

export interface Transaction {
  id: string;
  tradeDate: string;
  symbol: string;
  name: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fee: number;
  currency: string;
  amount: number;
  source: TradeSource;
  realizedPnl?: number;
}

export interface TransactionSummaryApiDto {
  totalTrades: number;
  buyAmount: number;
  sellAmount: number;
  commission: number;
  realizedPnl: number;
  tradedSymbolCount: number;
}

export interface PortfolioTransactionApiDto {
  id: string;
  date: string;
  symbol: string;
  name?: string;
  side: TradeSide;
  quantity: number | null;
  price: number | null;
  amount: number;
  commission: number;
  realizedPnl: number | null;
  currency: string;
  source: string;
  importBatchId: string;
  sourceFileName: string;
  sourceSection: string;
  rawRowIndex: number;
  accountId: string;
  description: string;
  ibkrType: string;
  eventType: string;
  rawRecord: unknown;
}

export interface TransactionsPaginationApiDto {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponseApiDto {
  summary: TransactionSummaryApiDto;
  transactions: PortfolioTransactionApiDto[];
  pagination: TransactionsPaginationApiDto;
  warnings: string[];
}

export interface TransactionListQuery {
  search: string;
  side: TransactionSideFilter;
  sortBy: TransactionSortBy;
  sortDirection: TransactionSortDirection;
  page: number;
  pageSize: number;
}
