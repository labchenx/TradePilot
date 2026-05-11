import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CardShell } from '@/components/common';
import type { MonthlyPerformancePoint } from '@/types';

interface PerformanceChartProps {
  data: MonthlyPerformancePoint[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <CardShell className="p-5 lg:col-span-2">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-white">Cumulative P/L 收益走势</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value: number) => `$${value / 1000}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="unrealized" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.14} />
            <Area type="monotone" dataKey="realized" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.08} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

