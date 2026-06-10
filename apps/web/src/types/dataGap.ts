export interface DataGapItem {
  date: string;
  reasons: string[];
  hasPrecedingData: boolean;
  hasFollowingData: boolean;
}

export interface DataGapCheckResponse {
  gaps: DataGapItem[];
  checkedRange: {
    start: string;
    end: string;
  };
  tradingDaysChecked: number;
  status: 'NO_TRADE_DATA' | 'HEALTHY' | 'HAS_GAPS';
}

export interface ManualFillTradePayload {
  symbol: string;
  tradeDate: string;
  tradeTime?: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  commission?: number;
  currency: string;
  accountId?: string;
  note?: string;
  cashAdjustmentMode?: 'ADJUST_CASH' | 'POSITION_ONLY';
}

export interface ManualFillResponse {
  importJobId: string;
  transactionEventId?: string;
  sourceHash: string;
  warnings: string[];
}
