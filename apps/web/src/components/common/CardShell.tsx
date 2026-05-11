import type { HTMLAttributes } from 'react';
import { cn } from '@/utils';

export function CardShell({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

