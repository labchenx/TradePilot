import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface TagProps {
  children: ReactNode;
  color: 'green' | 'red' | 'blue' | 'gray' | 'yellow' | 'indigo';
}

export function Tag({ children, color }: TagProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    gray: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', colorClasses[color])}>
      {children}
    </span>
  );
}

