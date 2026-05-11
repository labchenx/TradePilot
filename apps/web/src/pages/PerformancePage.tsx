import { ProfitLossNumber, StatCard, PageTitle } from '@/components/common';
import { PerformanceChart, PerformanceTable } from '@/components/performance';
import { performanceService } from '@/services';
import { formatCurrency } from '@/utils';

export function PerformancePage() {
  const { monthly, rows } = performanceService.getPerformance();
  const realized = rows.reduce((sum, row) => sum + row.realizedPnl, 0);
  const unrealized = rows.reduce((sum, row) => sum + row.unrealizedPnl, 0);
  const total = rows.reduce((sum, row) => sum + row.totalPnl, 0);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Performance 收益分析"
        description="Review realized, unrealized, and total return contribution by symbol"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Realized P/L 已实现盈亏" value={<ProfitLossNumber amount={realized} className="text-2xl" />} />
        <StatCard title="Unrealized P/L 未实现盈亏" value={<ProfitLossNumber amount={unrealized} className="text-2xl" />} />
        <StatCard title="Total P/L 累计收益" value={<ProfitLossNumber amount={total} className="text-2xl" />} />
        <StatCard title="Return Base 统计本金" value={formatCurrency(35000)} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PerformanceChart data={monthly} />
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Return Mix 收益构成</h3>
          <div className="space-y-4">
            {rows.slice(0, 4).map((row) => (
              <div key={row.symbol}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{row.symbol}</span>
                  <span className="text-neutral-500 dark:text-neutral-400">{row.contributionPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: `${Math.max(row.contributionPercent, 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PerformanceTable rows={rows} />
    </div>
  );
}

