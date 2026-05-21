import { useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button, CardShell, Input } from '@/components/common';
import type { TradingBehaviorQuery, TradingBehaviorRange } from '@/types';
import { cn } from '@/utils';

interface TradingBehaviorFiltersProps {
  query: TradingBehaviorQuery;
  loading: boolean;
  onQueryChange: (patch: Partial<TradingBehaviorQuery>) => void;
  onReset: () => void;
}

const ranges: Array<{ value: TradingBehaviorRange; label: string }> = [
  { value: '1M', label: '1个月' },
  { value: '3M', label: '3个月' },
  { value: 'YTD', label: '今年' },
  { value: 'ALL', label: '全部' },
];

export function TradingBehaviorFilters({
  query,
  loading,
  onQueryChange,
  onReset,
}: TradingBehaviorFiltersProps) {
  const [draftSymbol, setDraftSymbol] = useState(query.symbol);

  useEffect(() => {
    setDraftSymbol(query.symbol);
  }, [query.symbol]);

  useEffect(() => {
    const normalizedSymbol = draftSymbol.trim().toUpperCase();
    const currentSymbol = query.symbol.trim().toUpperCase();

    if (normalizedSymbol === currentSymbol) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onQueryChange({ symbol: normalizedSymbol });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [draftSymbol, onQueryChange, query.symbol]);

  return (
    <CardShell className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            时间范围
          </div>
          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
            {ranges.map((range) => (
              <button
                key={range.value}
                type="button"
                className={cn(
                  'h-8 rounded-md px-3 text-sm font-medium transition-colors',
                  query.range === range.value
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-800 dark:text-blue-300'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
                )}
                disabled={loading}
                onClick={() => onQueryChange({ range: range.value })}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block min-w-60">
            <span className="mb-2 block text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
              股票代码
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                value={draftSymbol}
                placeholder="NVDA / MSFT / TSLA"
                className="pl-9 uppercase"
                onChange={(event) =>
                  setDraftSymbol(event.target.value.toUpperCase())
                }
              />
            </div>
          </label>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={onReset}
            disabled={loading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            重置
          </Button>
        </div>
      </div>
    </CardShell>
  );
}
