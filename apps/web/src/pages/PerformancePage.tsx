import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, PageTitle } from '@/components/common';
import {
  AllocationPerformanceChart,
  AssetTrendPerformanceChart,
  MonthlyCashFlowChart,
  PerformanceSummaryCards,
  PerformanceTable,
  PnlContributionChart,
} from '@/components/performance';
import { usePerformance } from '@/hooks';

export function PerformancePage() {
  const { data, loading, error, refetch } = usePerformance();
  const warnings = data?.warnings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageTitle
          title="Performance 收益分析"
          description="基于数据库中的交易、现金流水、持仓和月度快照，查看整体收益、资产配置和盈亏贡献"
        />
        <Button variant="outline" size="sm" className="h-9" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          Performance 数据加载失败：{error}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            数据提醒
          </div>
          <ul className="space-y-1">
            {warnings.slice(0, 5).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          {warnings.length > 5 ? (
            <p className="mt-2 text-xs">还有 {warnings.length - 5} 条提醒未展示。</p>
          ) : null}
        </div>
      ) : null}

      <PerformanceSummaryCards summary={data?.summary} loading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AssetTrendPerformanceChart
          data={data?.assetTrend ?? []}
          loading={loading}
        />
        <AllocationPerformanceChart
          data={data?.allocation ?? []}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PnlContributionChart
          data={data?.pnlContribution ?? []}
          loading={loading}
        />
        <MonthlyCashFlowChart
          data={data?.monthlyCashFlows ?? []}
          loading={loading}
        />
      </div>

      <PerformanceTable rows={data?.pnlContribution ?? []} loading={loading} />
    </div>
  );
}
