import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardShell } from '@/components/common';
import type {
  AssetTrendPoint,
  MonthlyCashFlowPoint,
  PerformanceAllocationItem,
} from '@/types/performance';
import { formatCurrency } from '@/utils';

const chartColors = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#ef4444',
  '#64748b',
  '#0ea5e9',
];

const MAX_ALLOCATION_SLICES = 7;

function compactCurrency(value: number) {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }

  return `$${value.toFixed(0)}`;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
      {message}
    </div>
  );
}

function tooltipFormatter(value: unknown) {
  return typeof value === 'number' ? formatCurrency(value) : '--';
}

function colorForIndex(index: number) {
  return chartColors[index % chartColors.length];
}

function buildAllocationChartData(data: PerformanceAllocationItem[]) {
  const sorted = data
    .filter((item) => item.marketValue !== null)
    .sort((left, right) => (right.marketValue ?? 0) - (left.marketValue ?? 0));
  const topItems = sorted.slice(0, MAX_ALLOCATION_SLICES);
  const restItems = sorted.slice(MAX_ALLOCATION_SLICES);
  const restMarketValue = restItems.reduce(
    (sum, item) => sum + (item.marketValue ?? 0),
    0,
  );
  const restWeight = restItems.reduce((sum, item) => sum + (item.weight ?? 0), 0);

  if (restItems.length === 0 || restMarketValue <= 0) {
    return topItems;
  }

  return [
    ...topItems,
    {
      symbol: 'Others',
      name: `其他 ${restItems.length} 项`,
      marketValue: restMarketValue,
      weight: restWeight,
    },
  ];
}

export function AssetTrendPerformanceChart({
  data,
  loading,
}: {
  data: AssetTrendPoint[];
  loading: boolean;
}) {
  return (
    <CardShell className="p-5 lg:col-span-2">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          资产趋势 Asset Trend
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          展示月度快照中的总资产与净入金变化
        </p>
      </div>
      {loading ? (
        <EmptyChart message="资产趋势加载中..." />
      ) : data.length === 0 ? (
        <EmptyChart message="暂无月度快照数据。" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={compactCurrency}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalAssets"
                name="总资产 Total Assets"
                stroke="#2563eb"
                strokeWidth={3}
                fill="#2563eb"
                fillOpacity={0.12}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="netDeposit"
                name="净入金 Net Deposit"
                stroke="#64748b"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardShell>
  );
}

export function AllocationPerformanceChart({
  data,
  loading,
}: {
  data: PerformanceAllocationItem[];
  loading: boolean;
}) {
  const visibleData = data.filter((item) => item.marketValue !== null);
  const chartData = buildAllocationChartData(data);

  return (
    <CardShell className="p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          资产配置 Allocation
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          按当前持仓市值统计，权重口径与 Holdings 页面一致
        </p>
      </div>
      {loading ? (
        <EmptyChart message="资产配置加载中..." />
      ) : visibleData.length === 0 ? (
        <EmptyChart message="暂无可计算的资产配置数据。" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(180px,240px)_1fr] xl:items-center">
          <div className="h-52 xl:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="marketValue"
                  nameKey="symbol"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {chartData.map((item, index) => (
                    <Cell key={item.symbol} fill={colorForIndex(index)} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {visibleData.map((item, index) => (
              <div
                key={item.symbol}
                className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2 text-sm"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colorForIndex(index) }}
                />
                <span
                  className="truncate font-medium text-neutral-700 dark:text-neutral-200"
                  title={item.name ?? item.symbol}
                >
                  {item.symbol}
                  {item.name && item.name !== item.symbol ? (
                    <span className="ml-1 font-normal text-neutral-500">
                      {item.name}
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
                  {item.weight === null ? '--' : `${(item.weight * 100).toFixed(1)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardShell>
  );
}

export function MonthlyCashFlowChart({
  data,
  loading,
}: {
  data: MonthlyCashFlowPoint[];
  loading: boolean;
}) {
  return (
    <CardShell className="p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          月度资金流
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          仅统计 DEPOSIT / WITHDRAWAL 入金出金
        </p>
      </div>
      {loading ? (
        <EmptyChart message="资金流加载中..." />
      ) : data.length === 0 ? (
        <EmptyChart message="暂无入金或出金数据。" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={compactCurrency}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar dataKey="deposits" name="入金 Deposits" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" name="出金 Withdrawals" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="netDepositChange"
                name="净变化"
                stroke="#10b981"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardShell>
  );
}
