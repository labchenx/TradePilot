export type CashFlowType = 'Deposit' | 'Withdrawal';

export type CashFlowSortBy = 'date' | 'amount' | 'type';
export type CashFlowSortDirection = 'asc' | 'desc';

export interface CashFlow {
  id: string;
  date: string;
  type: CashFlowType;
  amount: number;
  currency: string;
  remark?: string;
  source?: string;
}

export interface CashFlowSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  cashBalance: number;
  netDeposit: number;
  currency: string;
}

export interface CashFlowsData {
  summary: CashFlowSummary;
  items: CashFlow[];
  warnings?: string[];
}

export interface CashFlowFiltersState {
  type: CashFlowType | 'ALL';
  search: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: CashFlowSortBy;
  sortDirection: CashFlowSortDirection;
}
