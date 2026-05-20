import type { CashFlow } from '@/types';

export const mockCashFlows: CashFlow[] = [
  {
    id: 'cash-1',
    date: '2026-04-28',
    type: 'Deposit',
    amount: 5000,
    currency: 'USD',
    source: 'Bank Transfer',
    remark: 'Monthly savings',
  },
  {
    id: 'cash-2',
    date: '2026-04-15',
    type: 'Withdrawal',
    amount: -1200,
    currency: 'USD',
    source: 'Bank Transfer',
    remark: 'Living expense transfer',
  },
  {
    id: 'cash-4',
    date: '2026-03-20',
    type: 'Withdrawal',
    amount: -2000,
    currency: 'USD',
    source: 'Bank Transfer',
    remark: 'Car repair',
  },
  {
    id: 'cash-5',
    date: '2026-03-01',
    type: 'Deposit',
    amount: 10000,
    currency: 'USD',
    source: 'Bank Transfer',
    remark: 'Bonus',
  },
];
