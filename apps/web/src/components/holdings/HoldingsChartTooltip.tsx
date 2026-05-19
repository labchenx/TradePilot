import type { ReactNode } from 'react';
import { formatCurrency } from '@/utils';

interface TooltipPayloadItem {
  name?: string | number;
  value?: number;
  color?: string;
  payload?: {
    symbol?: string;
    marketValue?: number;
    weight?: number;
    unrealizedPnl?: number;
    color?: string;
  };
}

interface HoldingsTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function formatPercent(value: number | undefined) {
  return value === undefined ? '--' : `${(value * 100).toFixed(2)}%`;
}

function TooltipShell({
  color,
  title,
  children,
}: {
  color?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-48 rounded-lg border border-neutral-200 bg-white/95 px-3 py-2.5 shadow-xl shadow-neutral-900/10 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-950/95 dark:shadow-black/40">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color ?? '#3b82f6' }}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export function AllocationTooltip({ active, payload }: HoldingsTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const data = item.payload;
  const marketValue = data?.marketValue ?? item.value;

  return (
    <TooltipShell color={data?.color ?? item.color} title={data?.symbol ?? '持仓'}>
      <div className="space-y-1">
        <div className="text-base font-bold tabular-nums text-neutral-950 dark:text-white">
          {marketValue === undefined ? '--' : formatCurrency(marketValue)}
        </div>
        <div className="flex items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span>持仓占比</span>
          <span className="font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
            {formatPercent(data?.weight)}
          </span>
        </div>
      </div>
    </TooltipShell>
  );
}

export function PnlTooltip({ active, payload }: HoldingsTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const data = item.payload;
  const pnl = data?.unrealizedPnl ?? item.value;
  const isPositive = pnl === undefined || pnl >= 0;

  return (
    <TooltipShell color={isPositive ? '#10b981' : '#ef4444'} title={data?.symbol ?? '盈亏'}>
      <div className="space-y-1">
        <div
          className={`text-base font-bold tabular-nums ${
            isPositive
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {pnl === undefined ? '--' : formatCurrency(pnl)}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          未实现盈亏
        </div>
      </div>
    </TooltipShell>
  );
}
