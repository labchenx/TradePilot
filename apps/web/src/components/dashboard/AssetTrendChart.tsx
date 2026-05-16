import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardShell } from '@/components/common';
import type { AssetTrendRange, PerformancePoint } from '@/types';
import { cn } from '@/utils';

interface AssetTrendChartProps {
  data: PerformancePoint[];
  loading?: boolean;
  error?: string | null;
  onRangeChange?: (range: AssetTrendRange) => Promise<void>;
}

const ranges: { label: string; value: AssetTrendRange }[] = [
  { label: '1个月', value: '1M' },
  { label: '3个月', value: '3M' },
  { label: '今年', value: 'YTD' },
  { label: '过去一年', value: '1Y' },
  { label: '全部', value: 'ALL' },
];

function getNiceStep(rawStep: number) {
  if (rawStep <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return Math.max(1, Math.round(niceNormalized * magnitude));
}

function buildYAxis(data: PerformancePoint[]) {
  const values = data.map((point) => point.value);
  const maxValue = Math.max(0, ...values);
  const minValue = Math.min(0, ...values);
  const step = getNiceStep((maxValue - minValue) / 4);
  const min = minValue < 0 ? Math.floor(minValue / step) * step : 0;
  const max = Math.max(step, Math.ceil(maxValue / step) * step);
  const ticks: number[] = [];

  for (let value = min; value <= max; value += step) {
    ticks.push(value);
  }

  return { domain: [min, max] as [number, number], ticks };
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatAxisTick(value: number) {
  if (Math.abs(value) >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

export function AssetTrendChart({
  data,
  loading = false,
  error,
  onRangeChange,
}: AssetTrendChartProps) {
  const [timeRange, setTimeRange] = useState<AssetTrendRange>('ALL');
  const yAxis = buildYAxis(data);

  const handleRangeClick = (range: AssetTrendRange) => {
    setTimeRange(range);
    void onRangeChange?.(range);
  };

  return (
    <CardShell className="relative flex min-h-[430px] flex-col rounded-[14px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] lg:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg leading-7 font-semibold text-neutral-900 dark:text-white">
            Asset Trend 资产趋势
          </h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              成本口径资产
            </span>
            <span>历史月份按现金 + 持仓成本估算</span>
          </div>
        </div>
        <div className="flex w-fit flex-wrap rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          {ranges.map((range) => (
            <button
              type="button"
              key={range.value}
              onClick={() => handleRangeClick(range.value)}
              className={cn(
                'h-7 rounded-md px-3 text-xs leading-4 font-medium transition-colors',
                timeRange === range.value
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-xs text-red-500 dark:text-red-400">{error}</p>
      ) : null}

      <div className="relative mt-4 flex min-h-[320px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="assetTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              dy={12}
            />
            <YAxis
              axisLine={false}
              allowDecimals={false}
              domain={yAxis.domain}
              ticks={yAxis.ticks}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatAxisTick}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                color: '#171717',
              }}
              formatter={(value: number, name) => [formatCurrency(value), String(name)]}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="成本口径资产"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              fill="url(#assetTrendFill)"
              fillOpacity={1}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {loading ? (
          <div className="absolute inset-0 grid place-items-center rounded-lg bg-white/60 text-sm text-neutral-500 backdrop-blur-[1px] dark:bg-neutral-950/50 dark:text-neutral-400">
            Loading trend...
          </div>
        ) : null}
      </div>
    </CardShell>
  );
}
