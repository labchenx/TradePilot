import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common';

export function TablePagination() {
  return (
    <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Showing <span className="font-medium text-neutral-900 dark:text-white">1</span> to{' '}
        <span className="font-medium text-neutral-900 dark:text-white">6</span> of{' '}
        <span className="font-medium text-neutral-900 dark:text-white">42</span> results
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1 text-sm">
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-md font-medium ${
                page === 1
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              {page}
            </button>
          ))}
          <span className="px-1 text-neutral-400">...</span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            7
          </button>
        </div>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

