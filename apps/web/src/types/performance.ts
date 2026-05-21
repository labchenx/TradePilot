export interface AnalyticsSummary {
  totalAssets: number | null;
  totalReturn: number | null;
  returnRate: number | null;
  realizedPnl: number;
  unrealizedPnl: number | null;
  netDeposit: number;
}

export interface AssetTrendPoint {
  month: string;
  date: string;
  totalAssets: number | null;
  netDeposit: number;
  totalReturn: number | null;
}

export interface PerformanceAllocationItem {
  symbol: string;
  name?: string;
  marketValue: number | null;
  weight: number | null;
}

export interface PnlContributionItem {
  symbol: string;
  name?: string;
  realizedPnl: number;
  unrealizedPnl: number | null;
  totalPnl: number | null;
}

export interface RealizedVsUnrealized {
  realizedPnl: number;
  unrealizedPnl: number | null;
}

export interface MonthlyCashFlowPoint {
  month: string;
  deposits: number;
  withdrawals: number;
  netDepositChange: number;
}

export interface PortfolioAnalyticsResponse {
  summary: AnalyticsSummary;
  assetTrend: AssetTrendPoint[];
  allocation: PerformanceAllocationItem[];
  pnlContribution: PnlContributionItem[];
  realizedVsUnrealized: RealizedVsUnrealized;
  monthlyCashFlows: MonthlyCashFlowPoint[];
  warnings: string[];
  updatedAt: string;
}

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
