import {
  AllocationChart,
  AssetTrendChart,
  PortfolioStats,
  RealizedPnlBySymbol,
  RecentTradesTable,
  ReturnBreakdown,
} from '@/components/dashboard';
import { useDashboard } from '@/hooks';
import { summarizeDashboardWarnings } from '@/utils';

export function DashboardPage() {
  const {
    data: dashboard,
    loading,
    assetTrendLoading,
    error,
    assetTrendError,
    refetch,
    refetchAssetTrend,
  } = useDashboard();
  const warnings = dashboard?.warnings ?? [];
  const warningSummary = summarizeDashboardWarnings(warnings);

  if (loading) {
    return (
      <div className="rounded-[14px] border border-neutral-200 bg-white p-6 text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
        Loading Dashboard data...
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="rounded-[14px] border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/60 dark:bg-neutral-950">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Dashboard data request failed.</p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {warningSummary ? (
        <div className="rounded-[14px] border border-yellow-200 bg-yellow-50 p-4 shadow-sm dark:border-yellow-900/60 dark:bg-yellow-950/30">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">数据口径提示</p>
          <p className="mt-1 text-sm leading-6 text-yellow-800 dark:text-yellow-200">{warningSummary.headline}</p>
          {warningSummary.groups.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {warningSummary.groups.map((group) => (
                <span
                  key={group.key}
                  className="rounded-md border border-yellow-300/70 bg-white/60 px-2 py-1 text-xs font-medium text-yellow-800 dark:border-yellow-700/80 dark:bg-yellow-950/40 dark:text-yellow-200"
                >
                  {group.title} {group.count} 条
                </span>
              ))}
            </div>
          ) : null}
          {warningSummary.details.length > 0 ? (
            <details className="mt-3 text-sm text-yellow-800 dark:text-yellow-200">
              <summary className="cursor-pointer font-medium">查看 {warningSummary.total} 条明细 warning</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {warningSummary.details.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              {warningSummary.hiddenDetailCount > 0 ? (
                <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                  还有 {warningSummary.hiddenDetailCount} 条明细，可在接口返回中查看完整列表。
                </p>
              ) : null}
            </details>
          ) : null}
        </div>
      ) : null}

      <PortfolioStats stats={dashboard.stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AssetTrendChart
          data={dashboard.performance}
          loading={assetTrendLoading}
          error={assetTrendError}
          onRangeChange={refetchAssetTrend}
        />
        <AllocationChart data={dashboard.allocation} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ReturnBreakdown data={dashboard.returnBreakdown} />
        <RealizedPnlBySymbol data={dashboard.realizedPnlBySymbol} />
      </div>

      <RecentTradesTable transactions={dashboard.recentTransactions} />
    </div>
  );
}
