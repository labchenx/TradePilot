import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardShell } from '@/components/common';
import type { MonthlyTradeCount } from '@/types';

interface BehaviorFrequencyChartProps {
  data: MonthlyTradeCount[];
  loading: boolean;
}

export function BehaviorFrequencyChart({
  data,
  loading,
}: BehaviorFrequencyChartProps) {
  return (
    <CardShell className="p-5 lg:col-span-2">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          月度交易次数
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          BUY、SELL 与总交易次数
        </p>
      </div>
      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
          交易频率加载中...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
          暂无月度交易次数数据
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%" minHeight={288}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                allowDecimals={false}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="buyCount"
                name="BUY"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="sellCount"
                name="SELL"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="totalCount"
                name="总次数"
                fill="#64748b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardShell>
  );
}
