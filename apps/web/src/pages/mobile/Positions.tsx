import { Link } from 'react-router';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useDashboard, useHoldings } from '@/hooks';
import { cn } from '@/utils';
import { MobileEmpty, MobileError, MobileLoading } from './MobileState';
import { money, percent, pnlClass, signedMoney } from './mobileFormat';

function getDashboardStatValue(
  dashboard: ReturnType<typeof useDashboard>['data'],
  labelPrefix: string,
) {
  return dashboard?.stats.find((item) => item.label.startsWith(labelPrefix))?.value ?? null;
}

export function MobilePositions() {
  const { data, loading, error } = useHoldings();
  const { data: dashboardData, loading: dashboardLoading } = useDashboard();

  if (loading) return <MobileLoading label="加载持仓数据..." />;
  if (error) return <MobileError message={error} />;
  if (!data || data.holdings.length === 0) {
    return (
      <MobileEmpty
        title="暂无持仓"
        description="导入 IBKR 交易数据后，当前持仓会按 symbol 聚合展示。"
      />
    );
  }

  const largest = [...data.holdings]
    .filter((item) => item.marketValue !== null)
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))[0];
  const totalAssets = getDashboardStatValue(dashboardData, 'Total Assets');
  const stockAssetRatio =
    totalAssets && totalAssets > 0 && data.summary.totalMarketValue !== null
      ? data.summary.totalMarketValue / totalAssets
      : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">持仓数</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {data.summary.numberOfHoldings}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">总市值</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {money(data.summary.totalMarketValue)}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">总成本</p>
            <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
              {money(data.summary.totalCost)}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">未实现盈亏</p>
            <div className="flex items-baseline gap-1">
              <p className={cn('text-base font-bold', pnlClass(data.summary.unrealizedPnl))}>
                {signedMoney(data.summary.unrealizedPnl)}
              </p>
              <p className={cn('text-xs', pnlClass(data.summary.unrealizedPnl))}>
                {percent(data.summary.unrealizedReturnRate, true)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {data.holdings.map((position) => {
          const isProfit = (position.unrealizedPnl ?? 0) >= 0;
          const maxValue = Math.max(
            ...data.holdings.map((item) => item.marketValue ?? 0),
            1,
          );

          return (
            <Link
              key={position.symbol}
              to={`/stock/${position.symbol}`}
              className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-transform active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                    style={{
                      backgroundColor: `${position.color}20`,
                      color: position.color,
                    }}
                  >
                    {position.symbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-neutral-900 dark:text-white">
                      {position.symbol}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {position.name ?? position.currency}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className={cn('text-base font-bold tabular-nums', pnlClass(position.unrealizedPnl))}>
                    {signedMoney(position.unrealizedPnl)}
                  </div>
                  <div className={cn('mt-0.5 flex items-center justify-end gap-1 text-xs tabular-nums', pnlClass(position.unrealizedPnl))}>
                    {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {percent(position.unrealizedReturnRate, true)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <div>
                  <p className="mb-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">shares</p>
                  <p className="text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
                    {position.quantity.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">avgCost</p>
                  <p className="text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
                    {money(position.avgCost, position.currency)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">weight</p>
                  <p className="text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
                    {percent(position.weight, true)}
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">marketValue</span>
                  <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">
                    {money(position.marketValue, position.currency)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: position.color,
                      width: `${Math.max(((position.marketValue ?? 0) / maxValue) * 100, 2)}%`,
                    }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-100 to-neutral-50 p-4 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">股票资产占总资产</p>
            <p className="text-base font-semibold text-neutral-900 dark:text-white">
              {dashboardLoading ? '加载中...' : percent(stockAssetRatio, true)}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">最大持仓</p>
            <p className="text-base font-semibold text-neutral-900 dark:text-white">
              {largest ? `${largest.symbol} · ${percent(largest.weight, true)}` : '--'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
