export interface RecentTradeDto {
  date: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  commission: number;
}
