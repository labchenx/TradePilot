import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-500',
        className,
      )}
      {...props}
    />
  );
}

