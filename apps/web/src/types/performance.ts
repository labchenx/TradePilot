export interface PerformanceRow {
  symbol: string;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  contributionPercent: number;
}

export interface MonthlyPerformancePoint {
  month: string;
  realized: number;
  unrealized: number;
}

