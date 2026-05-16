import { CardShell } from '@/components/common';
import type { ReturnBreakdownItem } from '@/types';
import { cn, formatCurrency } from '@/utils';

interface ReturnBreakdownProps {
  data: ReturnBreakdownItem[];
}

function getSignedValue(item: ReturnBreakdownItem) {
  if (item.value === null) return 0;
  return item.tone === 'negative' ? -Math.abs(item.value) : item.value;
}

function formatBreakdownValue(item: ReturnBreakdownItem) {
  if (item.value === null) return '--';
  if (item.tone === 'positive') return `+${formatCurrency(item.value)}`;
  if (item.tone === 'negative') return `-${formatCurrency(Math.abs(item.value))}`;
  return formatCurrency(item.value);
}

export function ReturnBreakdown({ data }: ReturnBreakdownProps) {
  const total = data.reduce((sum, item) => sum + getSignedValue(item), 0);
  const maxAbsValue = Math.max(...data.map((item) => Math.abs(item.value ?? 0)), 1);
  const totalIsPositive = total >= 0;

  return (
    <CardShell className="flex min-h-[354px] flex-col rounded-[14px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h3 className="text-lg leading-7 font-semibold text-neutral-900 dark:text-white">Return Breakdown 收益构成</h3>

      <div className="mt-14 space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No return data</p>
        ) : null}
        {data.map((item) => {
          const width =
            item.value === null
              ? '2%'
              : `${Math.max((Math.abs(item.value) / maxAbsValue) * 100, 2)}%`;

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-4 text-sm leading-5">
                <span className="min-w-0 truncate text-neutral-500 dark:text-neutral-400">{item.label}</span>
                <span
                  className={cn(
                    'shrink-0 font-semibold tabular-nums',
                    item.tone === 'positive' && 'text-green-600 dark:text-green-400',
                    item.tone === 'negative' && 'text-red-600 dark:text-red-400',
                    item.tone === 'neutral' && 'text-neutral-900 dark:text-white',
                  )}
                >
                  {formatBreakdownValue(item)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className={cn(
                    'h-full rounded-full',
                    item.tone === 'negative' ? 'bg-red-500' : item.tone === 'neutral' ? 'bg-neutral-300' : 'bg-green-500',
                  )}
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-neutral-200 pt-5 dark:border-neutral-800">
        <span className="text-sm leading-5 font-semibold text-neutral-700 dark:text-neutral-300">Known P/L 已知收益</span>
        <span
          className={cn(
            'text-2xl leading-8 font-bold tabular-nums',
            totalIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
          )}
        >
          {totalIsPositive ? '+' : '-'}
          {formatCurrency(Math.abs(total))}
        </span>
      </div>
    </CardShell>
  );
}
