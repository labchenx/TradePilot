import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CardShell } from '@/components/common';
import type { HoldingsData } from '@/types';
import { formatCompactCurrency } from '@/utils';
import { AllocationTooltip } from './HoldingsChartTooltip';

interface HoldingsAllocationChartProps {
  allocation: HoldingsData['allocation'];
  totalMarketValue?: number | null;
  loading?: boolean;
}

export function HoldingsAllocationChart({
  allocation,
  totalMarketValue,
  loading,
}: HoldingsAllocationChartProps) {
  const [isTooltipActive, setIsTooltipActive] = useState(false);
  const sortedByValue = [...allocation]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 6);
  const hasData = sortedByValue.length > 0;

  return (
    <CardShell className="p-5 lg:col-span-1">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-white">
        持仓占比
      </h3>
      <div className="relative h-48">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            正在加载持仓占比...
          </div>
        ) : hasData ? (
          <div className="relative z-10 h-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={192}>
              <PieChart>
                <Pie
                  data={sortedByValue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="marketValue"
                  stroke="none"
                  onMouseEnter={() => setIsTooltipActive(true)}
                  onMouseLeave={() => setIsTooltipActive(false)}
                >
                  {sortedByValue.map((entry) => (
                    <Cell key={entry.symbol} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={<AllocationTooltip />}
                  cursor={false}
                  offset={18}
                  wrapperStyle={{ outline: 'none', zIndex: 30 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            暂无持仓占比数据
          </div>
        )}
        <div
          className={`pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center transition-opacity duration-150 ${
            isTooltipActive ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className="text-lg font-bold text-neutral-900 dark:text-white">
            {totalMarketValue === null || totalMarketValue === undefined
              ? '--'
              : formatCompactCurrency(totalMarketValue)}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            总市值
          </span>
        </div>
      </div>
    </CardShell>
  );
}
