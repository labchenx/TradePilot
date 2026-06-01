import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { useDashboard } from '@/hooks';
import type { AssetTrendRange } from '@/types';
import { cn } from '@/utils';
import { MobileEmpty, MobileError, MobileLoading } from './MobileState';
import { dateText, money, percent, pnlClass, signedMoney } from './mobileFormat';

const trendRanges: Array<{ label: string; value: AssetTrendRange }> = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' },
];

function statValue(data: ReturnType<typeof useDashboard>['data'], key: string) {
  return data?.stats.find((item) => item.label.startsWith(key))?.value ?? null;
}

export function MobileDashboard() {
  const {
    data,
    loading,
    assetTrendLoading,
    error,
    assetTrendError,
    refetchAssetTrend,
  } = useDashboard();
  const [trendRange, setTrendRange] = useState<AssetTrendRange>('ALL');

  async function changeTrendRange(range: AssetTrendRange) {
    setTrendRange(range);
    await refetchAssetTrend(range);
  }

  if (loading) return <MobileLoading label="加载投资总览..." />;
  if (error) return <MobileError message={error} />;
  if (!data) {
    return (
      <MobileEmpty
        title="暂无总览数据"
        description="导入交易和现金流水后，这里会显示真实的资产与收益情况。"
      />
    );
  }

  const totalAssets = statValue(data, 'Total Assets');
  const stockMarketValue = statValue(data, 'Stock Market Value');
  const cashBalance = statValue(data, 'Cash Balance') ?? statValue(data, 'Margin Loan');
  const netDeposit = statValue(data, 'Net Deposit');
  const totalReturn = statValue(data, 'Total Return');
  const returnRate = statValue(data, 'Return Rate');
  const isProfit = (totalReturn ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg dark:from-emerald-600 dark:to-emerald-700">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-sm opacity-90">总资产</p>
            <h2 className="text-3xl font-bold tabular-nums">{money(totalAssets)}</h2>
          </div>
          <div className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-sm font-semibold">
              {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {percent(returnRate)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-white/20 pt-3">
          <div>
            <p className="mb-1 text-xs opacity-75">股票市值</p>
            <p className="text-sm font-semibold tabular-nums">{money(stockMarketValue)}</p>
          </div>
          <div>
            <p className="mb-1 text-xs opacity-75">现金余额</p>
            <p className="text-sm font-semibold tabular-nums">{money(cashBalance)}</p>
          </div>
          <div>
            <p className="mb-1 text-xs opacity-75">总收益</p>
            <p className="text-sm font-semibold tabular-nums">{signedMoney(totalReturn)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            资产趋势
          </h3>
          {assetTrendLoading ? (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">加载中...</span>
          ) : null}
        </div>
        <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/80">
          {trendRanges.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => void changeTrendRange(range.value)}
              className={cn(
                'h-8 min-w-12 flex-1 rounded-lg px-2 text-xs font-semibold transition-colors',
                trendRange === range.value
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
        {assetTrendError ? (
          <div className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs leading-5 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-200">
            {assetTrendError}
          </div>
        ) : null}
        <div className={cn('h-48', assetTrendLoading && 'opacity-60')}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.performance} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="mobileAssetTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.35} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
              />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#mobileAssetTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <span>净入金：{money(netDeposit)}</span>
          <span>{data.performance.length} 个快照</span>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-4 text-base font-semibold text-neutral-900 dark:text-white">
          持仓占比
        </h3>
        {data.allocation.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">暂无持仓占比数据</p>
        ) : (
          <>
            <div className="relative mb-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.allocation}
                    dataKey="value"
                    nameKey="symbol"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {data.allocation.map((entry) => (
                      <Cell key={entry.symbol} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Holdings</span>
                <span className="text-base font-bold text-neutral-900 dark:text-white">
                  {data.allocation.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.allocation.slice(0, 8).map((item) => (
                <div key={item.symbol} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {item.symbol}
                  </span>
                  <span className="ml-auto tabular-nums text-neutral-500 dark:text-neutral-400">
                    {totalAssets ? percent(((item.value ?? 0) / totalAssets) * 100) : '--'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-4 text-base font-semibold text-neutral-900 dark:text-white">
          收益构成
        </h3>
        <div className="space-y-3">
          {data.returnBreakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                {item.label.split(' ')[0]}
              </span>
              <span className={cn('text-sm font-semibold tabular-nums', pnlClass(item.value))}>
                {signedMoney(item.value)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            最近交易
          </h3>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400"
          >
            查看全部
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {data.recentTransactions.slice(0, 4).map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-bold',
                    trade.side === 'BUY'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  )}
                >
                  {trade.side}
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">
                    {trade.symbol}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {dateText(trade.tradeDate)} · {trade.quantity} 股
                  </div>
                </div>
              </div>
              <div className="text-right text-sm font-semibold tabular-nums text-neutral-900 dark:text-white">
                {money(trade.amount)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
