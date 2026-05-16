import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CardShell } from '@/components/common';
import type { AllocationItem } from '@/types';
import { formatCurrency } from '@/utils';

interface AllocationChartProps {
  data: AllocationItem[];
}

interface AllocationTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: AllocationItem;
    value: number;
  }>;
}

function formatQuantity(value?: number) {
  if (value === undefined) return '--';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
}

function AllocationTooltip({ active, payload }: AllocationTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item || item.value === null) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
      <p className="font-semibold text-neutral-900 dark:text-white">{item.symbol}</p>
      <p className="mt-1 max-w-[220px] truncate text-neutral-500 dark:text-neutral-400">
        {item.name ?? item.symbol}
      </p>
      {!item.isCash ? (
        <p className="mt-1 text-neutral-600 tabular-nums dark:text-neutral-300">
          Shares: {formatQuantity(item.quantity)}
        </p>
      ) : null}
      <p className="mt-1 text-neutral-600 tabular-nums dark:text-neutral-300">
        Value: {formatCurrency(item.value)}
      </p>
    </div>
  );
}

export function AllocationChart({ data }: AllocationChartProps) {
  const chartData = data.filter((item) => item.value !== null);
  const totalValue = chartData.reduce((sum, item) => sum + (item.value ?? 0), 0);
  const stockCount = data.filter((item) => !item.isCash).length;

  return (
    <CardShell className="rounded-[14px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h3 className="text-lg leading-7 font-semibold text-neutral-900 dark:text-white">Allocation 持仓占比</h3>

      <div className="relative mt-5 h-48">
        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              dataKey="value"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.symbol} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={<AllocationTooltip />}
              wrapperStyle={{ zIndex: 20 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
          <span className="text-xs leading-4 text-neutral-500 dark:text-neutral-400">Holdings</span>
          <span className="text-lg leading-7 font-bold text-neutral-900 dark:text-white">{stockCount} Stocks</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {data.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No allocation data</p>
        ) : null}
        {data.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between gap-4 text-sm leading-5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate font-medium text-neutral-700 dark:text-neutral-300">{item.symbol}</span>
            </div>
            <span className="shrink-0 text-neutral-500 tabular-nums dark:text-neutral-400">
              {item.value === null
                ? '--'
                : totalValue === 0
                  ? '0.0%'
                  : `${((item.value / totalValue) * 100).toFixed(1)}%`}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
