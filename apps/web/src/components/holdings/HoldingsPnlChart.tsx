import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CardShell } from '@/components/common';
import type { Holding } from '@/types';

interface HoldingsPnlChartProps {
  holdings: Holding[];
}

export function HoldingsPnlChart({ holdings }: HoldingsPnlChartProps) {
  const sortedByPnl = [...holdings].sort((a, b) => b.unrealizedPnl - a.unrealizedPnl);

  return (
    <CardShell className="p-5 lg:col-span-2">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-white">P/L by Symbol 个股盈亏</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
          <BarChart data={sortedByPnl}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
            <XAxis dataKey="symbol" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value: number) => `$${value / 1000}k`} />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'P/L']}
            />
            <Bar dataKey="unrealizedPnl" radius={[4, 4, 4, 4]}>
              {sortedByPnl.map((entry) => (
                <Cell key={entry.symbol} fill={entry.unrealizedPnl >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

