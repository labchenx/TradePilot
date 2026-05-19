import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
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

type TrendSeriesKey = 'value' | 'netDeposit' | 'stockMarketValue' | 'cashBalance';

const ranges: { label: string; value: AssetTrendRange }[] = [
  { label: '1个月', value: '1M' },
  { label: '3个月', value: '3M' },
  { label: '今年', value: 'YTD' },
  { label: '过去一年', value: '1Y' },
  { label: '全部', value: 'ALL' },
];

const seriesConfig: Array<{
  key: TrendSeriesKey;
  label: string;
  color: string;
  defaultVisible: boolean;
}> = [
  {
    key: 'value',
    label: 'Total Assets 总资产',
    color: '#10b981',
    defaultVisible: true,
  },
  {
    key: 'netDeposit',
    label: 'Net Deposit 净入金',
    color: '#3b82f6',
    defaultVisible: true,
  },
  {
    key: 'stockMarketValue',
    label: 'Stock Market Value 股票市值',
    color: '#8b5cf6',
    defaultVisible: false,
  },
  {
    key: 'cashBalance',
    label: 'Cash Balance 现金/融资',
    color: '#ef4444',
    defaultVisible: false,
  },
];

function getNiceStep(rawStep: number) {
  if (rawStep <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return Math.max(1, Math.round(niceNormalized * magnitude));
}

function buildYAxis(
  data: PerformancePoint[],
  visibleSeries: Record<TrendSeriesKey, boolean>,
) {
  const activeKeys = seriesConfig
    .filter((series) => visibleSeries[series.key])
    .map((series) => series.key);
  const values = data.flatMap((point) =>
    activeKeys
      .map((key) => point[key])
      .filter((value): value is number => typeof value === 'number'),
  );
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

function formatCurrency(value: number | null) {
  if (value === null) return '--';
  return `$${Math.round(value).toLocaleString()}`;
}

function formatAxisTick(value: number) {
  if (Math.abs(value) >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

function buildInitialVisibleSeries() {
  return seriesConfig.reduce(
    (result, series) => ({
      ...result,
      [series.key]: series.defaultVisible,
    }),
    {} as Record<TrendSeriesKey, boolean>,
  );
}

export function AssetTrendChart({
  data,
  loading = false,
  error,
  onRangeChange,
}: AssetTrendChartProps) {
  const [timeRange, setTimeRange] = useState<AssetTrendRange>('ALL');
  const [visibleSeries, setVisibleSeries] = useState(buildInitialVisibleSeries);
  const yAxis = buildYAxis(data, visibleSeries);

  const handleRangeClick = (range: AssetTrendRange) => {
    setTimeRange(range);
    void onRangeChange?.(range);
  };

  const toggleSeries = (key: TrendSeriesKey) => {
    setVisibleSeries((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <CardShell className="relative flex min-h-[360px] flex-col rounded-[14px] border border-neutral-200 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg leading-7 font-semibold text-neutral-900 dark:text-white">
            Asset Trend 资产趋势
          </h3>
          <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            按月末持仓与历史价格计算，现金余额包含融资负现金
          </p>
        </div>
        <div className="flex w-fit shrink-0 flex-wrap rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
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

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs leading-5">
        {seriesConfig.map((series) => (
          <button
            type="button"
            key={series.key}
            onClick={() => toggleSeries(series.key)}
            className={cn(
              'inline-flex h-5 items-center gap-1.5 transition-colors',
              visibleSeries[series.key]
                ? 'text-neutral-700 dark:text-neutral-200'
                : 'text-neutral-300 dark:text-neutral-600',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                visibleSeries[series.key] ? 'opacity-100' : 'opacity-35',
              )}
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-3 text-xs text-red-500 dark:text-red-400">{error}</p>
      ) : null}

      <div className="relative mt-4 flex min-h-[230px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id="assetTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
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
              formatter={(value, name) => [
                formatCurrency(typeof value === 'number' ? value : null),
                String(name),
              ]}
            />
            {visibleSeries.value ? (
              <Area
                type="monotone"
                dataKey="value"
                name="Total Assets 总资产"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                fill="url(#assetTrendFill)"
                fillOpacity={1}
              />
            ) : null}
            {visibleSeries.netDeposit ? (
              <Line
                type="monotone"
                dataKey="netDeposit"
                name="Net Deposit 净入金"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
            {visibleSeries.stockMarketValue ? (
              <Line
                type="monotone"
                dataKey="stockMarketValue"
                name="Stock Market Value 股票市值"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
            {visibleSeries.cashBalance ? (
              <Line
                type="monotone"
                dataKey="cashBalance"
                name="Cash Balance 现金/融资"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
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
