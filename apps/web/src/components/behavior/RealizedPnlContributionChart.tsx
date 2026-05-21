import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardShell } from '@/components/common';
import type { RealizedPnlContribution } from '@/types';
import { formatCompactCurrency, formatCurrency } from '@/utils';

interface RealizedPnlContributionChartProps {
  data: RealizedPnlContribution[];
  loading: boolean;
}

function tooltipFormatter(value: unknown) {
  return typeof value === 'number' ? formatCurrency(value) : '--';
}

export function RealizedPnlContributionChart({
  data,
  loading,
}: RealizedPnlContributionChartProps) {
  const chartData = data.slice(0, 10);

  return (
    <CardShell className="p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          已实现盈亏贡献
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          按 symbol 汇总数据库中的 IBKR realizedPnl
        </p>
      </div>
      {loading ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
          已实现盈亏加载中...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
          暂无已实现盈亏贡献数据
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactCurrency}
              />
              <YAxis
                type="category"
                dataKey="symbol"
                width={54}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey="realizedPnl" name="已实现盈亏" radius={[0, 4, 4, 0]}>
                {chartData.map((item) => (
                  <Cell
                    key={item.symbol}
                    fill={item.realizedPnl >= 0 ? '#16a34a' : '#dc2626'}
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
