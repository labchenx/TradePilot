export interface DashboardCurrencyBreakdownDto {
  currency: string;
  cashBalance: number;
  netDeposit: number;
  deposit: number;
  withdrawal: number;
  cashBalanceInBaseCurrency: number;
  netDepositInBaseCurrency: number;
}

export interface DashboardSummaryDto {
  totalAssets: number | null;
  stockMarketValue: number | null;
  cashBalance: number;
  accruedDividend: number;
  netDeposit: number;
  totalPnl: number | null;
  totalReturn: number | null;
  returnRate: number | null;
  realizedPnl: number;
  realizedNetIncome: number;
  estimated: {
    stockMarketValue: boolean;
    totalAssets: boolean;
    totalPnl: boolean;
    returnRate: boolean;
  };
  currencyBreakdown?: DashboardCurrencyBreakdownDto[];
  exchangeRate: {
    baseCurrency: string;
    updatedAt: string;
    source: string;
    rates: Record<string, number>;
  };
  marketData: {
    provider: 'YAHOO_FINANCE';
    missingQuoteSymbols: string[];
  };
  debug?: {
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
      source: string;
    };
    netDepositDebug: {
      deposits: number;
      withdrawals: number;
      netDeposit: number;
      source: string;
    };
    positionDebug: Array<{
      symbol: string;
      quantity: number;
      remainingCost: number;
      averageCost: number;
      quotePrice: number | null;
      marketValue: number | null;
      unrealizedPnl: number | null;
    }>;
    realizedDebug: {
      realizedPnlFromDb: number | null;
      realizedPnlFromFifo: number;
      source: string;
    };
  };
  warnings?: string[];
}
