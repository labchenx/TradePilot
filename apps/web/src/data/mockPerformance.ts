import type { MonthlyPerformancePoint, PerformanceRow } from '@/types';

export const mockPerformanceRows: PerformanceRow[] = [
  { symbol: 'AMD', realizedPnl: 1809, unrealizedPnl: 3160, totalPnl: 4969, contributionPercent: 37.3 },
  { symbol: 'NVDA', realizedPnl: 0, unrealizedPnl: 3080, totalPnl: 3080, contributionPercent: 23.1 },
  { symbol: 'AAPL', realizedPnl: 240, unrealizedPnl: 1188, totalPnl: 1428, contributionPercent: 10.7 },
  { symbol: 'MSFT', realizedPnl: 0, unrealizedPnl: 200, totalPnl: 200, contributionPercent: 1.5 },
  { symbol: 'TSLA', realizedPnl: 420, unrealizedPnl: -1061.1, totalPnl: -641.1, contributionPercent: -4.8 },
];

export const mockMonthlyPerformance: MonthlyPerformancePoint[] = [
  { month: 'Oct', realized: 0, unrealized: 2600 },
  { month: 'Nov', realized: 300, unrealized: 4200 },
  { month: 'Dec', realized: 120, unrealized: 3900 },
  { month: 'Jan', realized: 780, unrealized: 5600 },
  { month: 'Feb', realized: 1250, unrealized: 7100 },
  { month: 'Mar', realized: 2469, unrealized: 6567 },
];

