import type { Transaction } from './transaction';

export interface DashboardStat {
  label: string;
  value: number;
  currency?: string;
  percent?: boolean;
  positive?: boolean;
}

export interface PerformancePoint {
  date: string;
  value: number;
}

export interface AllocationItem {
  symbol: string;
  value: number;
  color: string;
}

export interface SyncStatus {
  title: string;
  timestamp: string;
  importedRecords: number;
  duplicatesSkipped: number;
  failedRecords: number;
}

export interface DashboardData {
  stats: DashboardStat[];
  performance: PerformancePoint[];
  allocation: AllocationItem[];
  recentTransactions: Transaction[];
  syncStatus: SyncStatus;
}

