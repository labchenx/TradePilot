export type IbkrEventType =
  | 'TRADE_BUY'
  | 'TRADE_SELL'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'DIVIDEND'
  | 'PAYMENT_IN_LIEU'
  | 'WITHHOLDING_TAX'
  | 'DEBIT_INTEREST'
  | 'OTHER_FEE'
  | 'FX_COMPONENT'
  | 'STOCK_GRANT'
  | 'STOCK_DIVIDEND'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'SPLIT'
  | 'REVERSE_SPLIT'
  | 'ADJUSTMENT'
  | 'UNKNOWN';

export type TradeSide = 'BUY' | 'SELL';

export interface TransactionEvent {
  id?: string;
  importFileId?: string;
  source: 'IBKR_CSV';
  sourceFileName?: string;
  sourceSection: string;
  rawRowIndex: number;
  rawData: Record<string, string>;
  tradeDate: string;
  accountId: string;
  description: string;
  ibkrType: string;
  eventType: IbkrEventType;
  symbol?: string;
  quantity?: number;
  absQuantity?: number;
  price?: number;
  currency?: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  side?: TradeSide;
  isTrade: boolean;
  isExternalCashFlow: boolean;
  isIncome: boolean;
  isTaxOrFee: boolean;
}

export interface ImportSummary {
  totalRows: number;
  parsedRows: number;
  tradeRows: number;
  cashFlowRows: number;
  warningCount: number;
  errorCount: number;
  depositTotal: number;
  withdrawalTotal: number;
  netDeposit: number;
  dividendTotal: number;
  taxAndFeeTotal: number;
  tradeBuyTotal: number;
  tradeSellTotal: number;
  commissionTotal: number;
  cashReport?: {
    beginningCash: number;
    deposits: number;
    withdrawals: number;
    buyCash: number;
    sellCash: number;
    dividends: number;
    paymentInLieu: number;
    withholdingTax: number;
    interest: number;
    commissions: number;
    fees: number;
    fxCashPnl: number;
    otherCashAdjustments: number;
    accruedDividend: number;
    cashBalance: number;
    settledCash?: number;
  };
  realizedPnlFromStatement?: number;
}

export interface ParseIssue {
  rawRowIndex?: number;
  message: string;
}

export interface IbkrCsvParseResult {
  isSupported: boolean;
  headerRowIndex?: number;
  headers: string[];
  parsedEvents: TransactionEvent[];
  summary: ImportSummary;
  warnings: ParseIssue[];
  errors: ParseIssue[];
}
