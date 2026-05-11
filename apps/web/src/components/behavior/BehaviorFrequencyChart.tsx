import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CardShell } from '@/components/common';
import type { TradingFrequencyPoint } from '@/types';

interface BehaviorFrequencyChartProps {
  data: TradingFrequencyPoint[];
}

export function BehaviorFrequencyChart({ data }: BehaviorFrequencyChartProps) {
  return (
    <CardShell className="p-5 lg:col-span-2">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-white">Trading Frequency 交易频率</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="buy" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sell" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

