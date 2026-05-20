import type { Dispatch, SetStateAction } from 'react';
import { Download, RefreshCcw, Search } from 'lucide-react';
import { Button, Input } from '@/components/common';
import type { CashFlowFiltersState, CashFlowType } from '@/types';

interface CashFlowFiltersProps {
  filters: CashFlowFiltersState;
  setFilters: Dispatch<SetStateAction<CashFlowFiltersState>>;
  onReset: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
}

const cashFlowTypes: CashFlowType[] = [
  'Deposit',
  'Withdrawal',
];

const cashFlowTypeLabels: Record<CashFlowType, string> = {
  Deposit: '入金',
  Withdrawal: '出金',
};

export function CashFlowFilters({
  filters,
  setFilters,
  onReset,
  onExport,
  exportDisabled,
}: CashFlowFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-t-xl border-b border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="w-36">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">类型</label>
        <select
          value={filters.type}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              type: event.target.value as CashFlowFiltersState['type'],
            }))
          }
          className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:[&>option]:bg-neutral-900 [&>option]:text-neutral-900"
        >
          <option value="ALL">全部类型</option>
          {cashFlowTypes.map((type) => (
            <option key={type} value={type}>
              {cashFlowTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[220px] flex-1">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">搜索金额 / 备注</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            placeholder="入金、出金、银行转账..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="w-36">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">开始日期</label>
        <Input
          type="date"
          value={filters.startDate}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              startDate: event.target.value,
            }))
          }
          className="text-neutral-600"
        />
      </div>
      <div className="w-36">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">结束日期</label>
        <Input
          type="date"
          value={filters.endDate}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              endDate: event.target.value,
            }))
          }
          className="text-neutral-600"
        />
      </div>
      <div className="w-28">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">最小金额</label>
        <Input
          type="number"
          min="0"
          value={filters.minAmount}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              minAmount: event.target.value,
            }))
          }
          placeholder="0"
        />
      </div>
      <div className="w-28">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">最大金额</label>
        <Input
          type="number"
          min="0"
          value={filters.maxAmount}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              maxAmount: event.target.value,
            }))
          }
          placeholder="不限"
        />
      </div>
      <div className="w-32">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">排序字段</label>
        <select
          value={filters.sortBy}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              sortBy: event.target.value as CashFlowFiltersState['sortBy'],
            }))
          }
          className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:[&>option]:bg-neutral-900 [&>option]:text-neutral-900"
        >
          <option value="date">日期</option>
          <option value="amount">金额</option>
          <option value="type">类型</option>
        </select>
      </div>
      <div className="w-32">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">排序方向</label>
        <select
          value={filters.sortDirection}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              sortDirection: event.target.value as CashFlowFiltersState['sortDirection'],
            }))
          }
          className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:[&>option]:bg-neutral-900 [&>option]:text-neutral-900"
        >
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-9" onClick={onReset}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          重置
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-9"
          onClick={onExport}
          disabled={exportDisabled}
        >
          <Download className="mr-2 h-4 w-4" />
          导出 CSV
        </Button>
      </div>
    </div>
  );
}
