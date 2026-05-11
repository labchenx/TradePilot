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
  ],
  recentTransactions: mockTransactions.slice(0, 4),
  syncStatus: {
    title: 'Last IBKR Email Import',
    timestamp: 'Today at 10:45 AM',
    importedRecords: 12,
    duplicatesSkipped: 3,
    failedRecords: 0,
  },
};

