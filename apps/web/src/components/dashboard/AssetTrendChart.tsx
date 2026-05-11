import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardShell } from '@/components/common';
import type { PerformancePoint } from '@/types';

interface AssetTrendChartProps {
  data: PerformancePoint[];
}

export function AssetTrendChart({ data }: AssetTrendChartProps) {
  const [timeRange, setTimeRange] = useState('6M');

  return (
    <CardShell className="p-5 lg:col-span-2">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Asset Trend 资产趋势</h3>
        <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          {['1M', '3M', '6M', '1Y', 'All'].map((range) => (
            <button
              type="button"
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === range
                  ? 'bg-white text-black shadow-sm dark:bg-neutral-900 dark:text-white'
                  : 'text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="assetTrendValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value: number) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
            />
            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#assetTrendValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

