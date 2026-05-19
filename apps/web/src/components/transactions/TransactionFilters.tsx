import { RefreshCcw, Search } from 'lucide-react';
import { Button, Input } from '@/components/common';
import type {
  TransactionListQuery,
  TransactionSideFilter,
  TransactionSortBy,
  TransactionSortDirection,
} from '@/types';

interface TransactionFiltersProps {
  query: TransactionListQuery;
  loading?: boolean;
  onChange: (patch: Partial<TransactionListQuery>) => void;
  onReset: () => void;
}

const selectClassName =
  'flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus-visible:ring-neutral-500';

export function TransactionFilters({
  query,
  loading,
  onChange,
  onReset,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="min-w-[220px] flex-1">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
          搜索股票代码 / 名称
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="例如 AMD、Microsoft"
            className="pl-9"
          />
        </div>
      </div>

      <div className="w-32">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
          买卖方向
        </label>
        <select
          value={query.side}
          onChange={(event) =>
            onChange({ side: event.target.value as TransactionSideFilter })
          }
          className={selectClassName}
        >
          <option value="ALL">全部</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>

      <div className="w-44">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
          排序字段
        </label>
        <select
          value={query.sortBy}
          onChange={(event) =>
            onChange({ sortBy: event.target.value as TransactionSortBy })
          }
          className={selectClassName}
        >
          <option value="date">日期</option>
          <option value="amount">成交金额</option>
          <option value="realizedPnl">已实现盈亏</option>
          <option value="symbol">股票代码</option>
        </select>
      </div>

      <div className="w-40">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
          排序方向
        </label>
        <select
          value={query.sortDirection}
          onChange={(event) =>
            onChange({
              sortDirection: event.target.value as TransactionSortDirection,
            })
          }
          className={selectClassName}
        >
          <option value="desc">从高到低 / 最新优先</option>
          <option value="asc">从低到高 / 最早优先</option>
        </select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-9"
        onClick={onReset}
        disabled={loading}
      >
        <RefreshCcw className="mr-2 h-4 w-4" />
        重置
      </Button>
    </div>
  );
}
