export type TradeSide = 'BUY' | 'SELL';
export type TradeSource = 'MANUAL' | 'EMAIL' | 'IBKR_CSV';

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
