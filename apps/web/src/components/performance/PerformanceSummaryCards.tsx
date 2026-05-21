import { ProfitLossNumber, StatCard } from '@/components/common';
import type { AnalyticsSummary } from '@/types/performance';
import { formatCurrency, formatPercent } from '@/utils';

interface PerformanceSummaryCardsProps {
  summary?: AnalyticsSummary;
  loading: boolean;
}

function dash() {
  return <span className="text-neutral-400">--</span>;
}

function nullableCurrency(value: number | null | undefined) {
  return value === null || value === undefined ? dash() : formatCurrency(value);
}

function nullablePnl(value: number | null | undefined) {
  return value === null || value === undefined ? dash() : <ProfitLossNumber amount={value} />;
}

function nullablePercent(value: number | null | undefined) {
  if (value === null || value === undefined) return dash();
  return (
    <span
      className={
        value > 0
          ? 'text-green-600 dark:text-green-400'
          : value < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-neutral-600 dark:text-neutral-400'
      }
    >
      {formatPercent(value * 100)}
    </span>
  );
}

export function PerformanceSummaryCards({
  summary,
  loading,
}: PerformanceSummaryCardsProps) {
  const placeholder = loading ? '加载中...' : dash();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard
        title="Total Assets"
        value={loading || !summary ? placeholder : nullableCurrency(summary.totalAssets)}
        subValue="现金余额 + 股票市值"
      />
      <StatCard
        title="Total Return"
        value={loading || !summary ? placeholder : nullablePnl(summary.totalReturn)}
        trend={
          summary?.totalReturn === undefined || summary.totalReturn === null
            ? 'neutral'
            : summary.totalReturn >= 0
              ? 'up'
              : 'down'
        }
      />
      <StatCard
        title="Return Rate"
        value={loading || !summary ? placeholder : nullablePercent(summary.returnRate)}
        subValue="总收益 / 净入金"
      />
      <StatCard
        title="Realized P/L"
        value={loading || !summary ? placeholder : <ProfitLossNumber amount={summary.realizedPnl} />}
      />
      <StatCard
        title="Unrealized P/L"
        value={loading || !summary ? placeholder : nullablePnl(summary.unrealizedPnl)}
      />
      <StatCard
        title="Net Deposit"
        value={loading || !summary ? placeholder : formatCurrency(summary.netDeposit)}
        subValue="入金 + 出金"
      />
    </div>
  );
}
