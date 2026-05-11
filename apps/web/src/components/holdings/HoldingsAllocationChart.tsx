import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CardShell } from '@/components/common';
import type { Holding } from '@/types';

interface HoldingsAllocationChartProps {
  holdings: Holding[];
}

export function HoldingsAllocationChart({ holdings }: HoldingsAllocationChartProps) {
  const sortedByValue = [...holdings].sort((a, b) => b.marketValue - a.marketValue);

  return (
    <CardShell className="p-5 lg:col-span-1">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-white">Allocation 持仓占比</h3>
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
          <PieChart>
            <Pie data={sortedByValue} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="marketValue" stroke="none">
              {sortedByValue.map((entry) => (
                <Cell key={entry.symbol} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Market Value']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-neutral-900 dark:text-white">$42k</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Value</span>
        </div>
      </div>
    </CardShell>
  );
}

