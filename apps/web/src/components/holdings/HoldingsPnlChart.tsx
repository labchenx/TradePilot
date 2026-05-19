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
import type { HoldingPnlApiDto } from '@/types';
import { PnlTooltip } from './HoldingsChartTooltip';

interface HoldingsPnlChartProps {
  pnlBySymbol: HoldingPnlApiDto[];
  loading?: boolean;
}

export function HoldingsPnlChart({ pnlBySymbol, loading }: HoldingsPnlChartProps) {
  const sortedByPnl = [...pnlBySymbol]
    .sort((a, b) => b.unrealizedPnl - a.unrealizedPnl)
    .slice(0, 10);
  const hasData = sortedByPnl.length > 0;

  return (
    <CardShell className="p-5 lg:col-span-2">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-white">
        个股盈亏
      </h3>
      <div className="h-48">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            正在加载个股盈亏...
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={192}>
            <BarChart data={sortedByPnl}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--chart-grid)"
              />
              <XAxis
                dataKey="symbol"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--chart-axis)' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--chart-axis)' }}
                tickFormatter={(value: number) => `$${value / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: 'var(--chart-hover)', radius: 6 }}
                content={<PnlTooltip />}
                wrapperStyle={{ outline: 'none' }}
              />
              <Bar dataKey="unrealizedPnl" radius={[4, 4, 4, 4]}>
                {sortedByPnl.map((entry) => (
                  <Cell
                    key={entry.symbol}
                    fill={entry.unrealizedPnl >= 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            暂无个股盈亏数据
          </div>
        )}
      </div>
    </CardShell>
  );
}
