import {
  AllocationChart,
  AssetTrendChart,
  PortfolioStats,
  RecentTradesTable,
  SyncStatusCard,
} from '@/components/dashboard';
import { useDashboard } from '@/hooks';

export function DashboardPage() {
  const dashboard = useDashboard();

  return (
    <div className="space-y-6">
      <PortfolioStats stats={dashboard.stats} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AssetTrendChart data={dashboard.performance} />
        <AllocationChart data={dashboard.allocation} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentTradesTable transactions={dashboard.recentTransactions} />
        <SyncStatusCard status={dashboard.syncStatus} />
      </div>
    </div>
  );
}

