import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CardShell } from '@/components/common';
import type { AllocationItem } from '@/types';

interface AllocationChartProps {
  data: AllocationItem[];
}

export function AllocationChart({ data }: AllocationChartProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <CardShell className="p-5">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-white">Allocation 持仓占比</h3>
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
              {data.map((entry) => (
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
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Stocks</span>
          <span className="text-lg font-bold text-neutral-900 dark:text-white">{data.length}</span>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.symbol}</span>
            </div>
            <span className="text-neutral-500 dark:text-neutral-400">{((item.value / totalValue) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

