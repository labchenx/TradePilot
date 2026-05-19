import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common';
import type { TransactionsPaginationApiDto } from '@/types';

interface TablePaginationProps {
  pagination?: TransactionsPaginationApiDto;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  pagination,
  loading,
  onPageChange,
}: TablePaginationProps) {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 50;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        显示第{' '}
        <span className="font-medium text-neutral-900 dark:text-white">
          {start}
        </span>{' '}
        到{' '}
        <span className="font-medium text-neutral-900 dark:text-white">
          {end}
        </span>{' '}
        条，共{' '}
        <span className="font-medium text-neutral-900 dark:text-white">
          {total}
        </span>{' '}
        条交易
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="上一页"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-24 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="下一页"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
