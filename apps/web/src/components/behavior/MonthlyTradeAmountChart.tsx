import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardShell } from '@/components/common';
import type { MonthlyTradeAmount } from '@/types';
import { formatCompactCurrency, formatCurrency } from '@/utils';

interface MonthlyTradeAmountChartProps {
  data: MonthlyTradeAmount[];
  loading: boolean;
}

function tooltipFormatter(value: unknown) {
  return typeof value === 'number' ? formatCurrency(value) : '--';
}

export function MonthlyTradeAmountChart({
  data,
  loading,
}: MonthlyTradeAmountChartProps) {
  return (
    <CardShell className="p-5 lg:col-span-2">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          月度交易成交额
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          仅统计股票 BUY / SELL 成交现金流，不包含入金、出金、换汇和分红。
        </p>
      </div>
      {loading ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
          交易成交额加载中...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
          暂无月度交易成交额数据
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid
                stroke="#e5e7eb"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactCurrency}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar
                dataKey="buyAmount"
                name="买入成交额"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="sellAmount"
                name="卖出成交额"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
              <Line
                dataKey="netBuyAmount"
                name="净买入成交额"
                stroke="#111827"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardShell>
  );
}
