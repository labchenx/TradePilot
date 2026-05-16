import type { DashboardData } from '@/types';
import { mockTransactions } from './mockTransactions';

export const mockDashboard: DashboardData = {
  stats: [
    { label: 'Total Assets 总资产', value: 48320.52, currency: 'USD' },
    { label: 'Stock Market Value 股票市值', value: 42180.2, currency: 'USD' },
    { label: 'Cash Balance 现金余额', value: 6140.32, currency: 'USD' },
    { label: 'Net Deposit 净入金', value: 35000, currency: 'USD' },
    { label: 'Total P/L 总收益', value: 13320.52, currency: 'USD', positive: true },
    { label: 'Return Rate 收益率', value: 38.06, percent: true, positive: true },
    {
      label: 'Realized P/L 已实现盈亏',
      value: 3280.45,
      currency: 'USD',
      positive: true,
      subtitle: 'Avg Cost Method 平均成本法',
    },
    {
      label: 'Realized Net Income 已实现净收益',
      value: 3365.78,
      currency: 'USD',
      positive: true,
      subtitle: 'P/L + Dividends - Fees',
    },
  ],
  performance: [
    { date: 'Oct', value: 38000 },
    { date: 'Nov', value: 41000 },
    { date: 'Dec', value: 39500 },
    { date: 'Jan', value: 43200 },
    { date: 'Feb', value: 46800 },
    { date: 'Mar', value: 48320 },
  ],
  allocation: [
    { symbol: 'AMD', value: 12000, color: '#10b981' },
    { symbol: 'AAPL', value: 10500, color: '#3b82f6' },
    { symbol: 'TSLA', value: 8200, color: '#8b5cf6' },
    { symbol: 'NVDA', value: 7480, color: '#f59e0b' },
    { symbol: 'MSFT', value: 4000, color: '#6366f1' },
    { symbol: 'Cash', value: 6140.32, color: '#94a3b8', isCash: true },
  ],
  returnBreakdown: [
    {
      label: 'Realized P/L 已实现盈亏',
      value: 3280.45,
      tone: 'positive',
    },
    {
      label: 'Unrealized P/L 未实现盈亏',
      value: 9940.07,
      tone: 'positive',
    },
    {
      label: 'Dividends 股息',
      value: 195,
      tone: 'positive',
    },
    {
      label: 'Fees & Taxes 费用税费',
      value: 95,
      tone: 'negative',
    },
  ],
  realizedPnlBySymbol: [
    { symbol: 'NVDA', initials: 'NV', remainingQuantity: 8, value: 1240.35, returnRate: 18.4 },
    { symbol: 'TSLA', initials: 'TS', remainingQuantity: 3, value: 520.8, returnRate: 9.6 },
    { symbol: 'MSFT', initials: 'MS', remainingQuantity: 5, value: 260.12, returnRate: 5.1 },
    { symbol: 'AMD', initials: 'AM', remainingQuantity: 20, value: -180.45, returnRate: -4.2 },
    { symbol: 'AAPL', initials: 'AA', remainingQuantity: 6, value: -90.21, returnRate: -2.1 },
  ],
  recentTransactions: mockTransactions.slice(0, 4),
};
