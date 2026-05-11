import { RefreshCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Button, Input } from '@/components/common';

export function TransactionFilters() {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-t-xl border-b border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="max-w-xs flex-1 min-w-[200px]">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Search Symbol</label>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="e.g. AAPL" className="pl-9" />
        </div>
      </div>

      <div className="w-32">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Type</label>
        <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-neutral-500 dark:[&>option]:bg-neutral-900 [&>option]:text-neutral-900">
          <option value="ALL">All Types</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>

      <div className="w-36">
        <label className="mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Source</label>
        <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-neutral-500 dark:[&>option]:bg-neutral-900 [&>option]:text-neutral-900">
          <option value="ALL">All Sources</option>
          <option value="EMAIL">Email Import</option>
          <option value="MANUAL">Manual Input</option>
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-9">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button variant="secondary" size="sm" className="h-9">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>
    </div>
  );
}

