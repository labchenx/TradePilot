import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardShell } from '@/components/common';
import type { PnlContributionItem } from '@/types/performance';
import { formatCurrency } from '@/utils';

interface PnlContributionChartProps {
  data: PnlContributionItem[];
  loading: boolean;
}

function compactCurrency(value: number) {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }

  return `$${value.toFixed(0)}`;
}

function tooltipFormatter(value: unknown) {
  return typeof value === 'number' ? formatCurrency(value) : '--';
}

export function PnlContributionChart({
  data,
  loading,
}: PnlContributionChartProps) {
  const chartData = data.filter((item) => item.totalPnl !== null).slice(0, 10);

  return (
    <CardShell className="p-5 lg:col-span-2">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          盈亏贡献 P/L Contribution
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          默认按 totalPnl 从高到低排序
        </p>
      </div>
      {loading ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
          盈亏贡献加载中...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
          暂无可计算的盈亏贡献数据。
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="symbol" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={compactCurrency}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar dataKey="realizedPnl" name="已实现 P/L" radius={[4, 4, 0, 0]}>
                {chartData.map((item) => (
                  <Cell
                    key={`realized-${item.symbol}`}
                    fill={item.realizedPnl >= 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
              <Bar dataKey="unrealizedPnl" name="未实现 P/L" radius={[4, 4, 0, 0]}>
                {chartData.map((item) => (
                  <Cell
                    key={`unrealized-${item.symbol}`}
                    fill={(item.unrealizedPnl ?? 0) >= 0 ? '#60a5fa' : '#f97316'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardShell>
  );
}
