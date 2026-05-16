import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

export type DashboardEventRow = Prisma.TransactionEventGetPayload<object>;
export type DashboardImportFileRow = Prisma.ImportFileGetPayload<object>;

export interface PositionCostItem {
  symbol: string;
  remainingQuantity: Decimal;
  remainingCost: Decimal;
  averageCost: Decimal;
  realizedPnl: Decimal;
  totalSellProceeds: Decimal;
  totalAllocatedCost: Decimal;
  soldQuantity: Decimal;
  tradeCount: number;
  method: 'FIFO';
}

export interface PositionCostResult {
  positions: PositionCostItem[];
  totalRemainingCost: Decimal;
  totalRealizedPnl: Decimal;
  warnings: string[];
}

export interface CashCalculationResult {
  cashBalance: Decimal;
  netDeposit: Decimal;
  dividends: Decimal;
  paymentInLieu: Decimal;
  withholdingTax: Decimal;
  debitInterest: Decimal;
  otherFee: Decimal;
  realizedNetIncomeAdjustments: Decimal;
  cashDebug: {
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
    source: 'IBKR_CASH_REPORT' | 'TRANSACTION_EVENTS_FALLBACK';
  };
  netDepositDebug: {
    deposits: number;
    withdrawals: number;
    netDeposit: number;
    source: 'IBKR_IMPORT_SUMMARY' | 'TRANSACTION_EVENTS_FALLBACK';
  };
  currencyBreakdown: Array<{
    currency: string;
    cashBalance: number;
    netDeposit: number;
    deposit: number;
    withdrawal: number;
    cashBalanceInBaseCurrency: number;
    netDepositInBaseCurrency: number;
  }>;
  warnings: string[];
}

export interface RealizedPnlCalculationResult {
  realizedPnl: Decimal;
  realizedPnlFromDb: Decimal | null;
  realizedPnlFromFifo: Decimal;
  bySymbol: Map<string, Decimal>;
  source: 'IBKR_RAW_DATA' | 'FIFO';
  warnings: string[];
}

export interface MarketValuationItem {
  symbol: string;
  name?: string;
  quantity: Decimal;
  price: Decimal | null;
  currency: string | null;
  marketValue: Decimal | null;
  providerSymbol?: string;
  missingQuote: boolean;
}

export interface MarketValuationResult {
  items: MarketValuationItem[];
  stockMarketValue: Decimal | null;
  hasMissingQuote: boolean;
  warnings: string[];
}
