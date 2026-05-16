import { CardShell } from '@/components/common';
import type { RealizedPnlBySymbolItem } from '@/types';
import { cn, formatCurrency, formatPercent } from '@/utils';

interface RealizedPnlBySymbolProps {
  data: RealizedPnlBySymbolItem[];
}

const badgeStyles: Record<string, string> = {
  NVDA: 'bg-amber-100 text-amber-500',
  TSLA: 'bg-violet-100 text-violet-500',
  MSFT: 'bg-indigo-100 text-indigo-500',
  AMD: 'bg-emerald-100 text-emerald-500',
  AAPL: 'bg-blue-100 text-blue-500',
};

function formatDisplayCurrency(value: number) {
  if (value > 0) return `+${formatCurrency(value)}`;
  if (value < 0) return `-${formatCurrency(Math.abs(value))}`;
  return formatCurrency(0);
}

export function RealizedPnlBySymbol({ data }: RealizedPnlBySymbolProps) {
  const maxAbsValue = Math.max(...data.map((item) => Math.abs(item.value)), 1);

  return (
    <CardShell className="min-h-[354px] rounded-[14px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] lg:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg leading-7 font-semibold text-neutral-900 dark:text-white">
          Realized P/L by Symbol 单股已实现盈亏
        </h3>
        <span className="w-fit rounded-md bg-neutral-100 px-2 py-1 text-xs leading-4 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          IBKR realized P/L, FIFO fallback
        </span>
      </div>

      <div className="mt-7 max-h-[420px] space-y-4 overflow-y-auto pr-1">
        {data.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No realized P/L yet</p>
        ) : null}
        {data.map((item) => {
          const isPositive = item.value >= 0;
          const barWidth = `${Math.max((Math.abs(item.value) / maxAbsValue) * 50, 4)}%`;

          return (
            <div key={item.symbol} className="grid gap-4 sm:grid-cols-[180px_1fr_160px] sm:items-center">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs leading-4 font-bold',
                    badgeStyles[item.symbol] ?? 'bg-blue-100 text-blue-500',
                  )}
                >
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base leading-6 font-bold text-neutral-900 dark:text-white">{item.symbol}</p>
                  <p className="text-xs leading-4 text-neutral-500 dark:text-neutral-400">Remaining {item.remainingQuantity}</p>
                </div>
              </div>

              <div className="relative mx-auto h-1.5 w-full max-w-[152px] rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className={cn('absolute top-0 h-1.5 rounded-full', isPositive ? 'left-1/2 bg-green-500' : 'right-1/2 bg-red-500')}
                  style={{ width: barWidth }}
                />
              </div>

              <div className="text-left sm:text-right">
                <p
                  className={cn(
                    'text-base leading-6 font-bold tabular-nums',
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {formatDisplayCurrency(item.value)}
                </p>
                <p
                  className={cn(
                    'text-xs leading-4 tabular-nums',
                    isPositive ? 'text-green-600/70 dark:text-green-400/70' : 'text-red-600/70 dark:text-red-400/70',
                  )}
                >
                  {formatPercent(item.returnRate)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}
