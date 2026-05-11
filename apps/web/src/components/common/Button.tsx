import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ children, variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const variants = {
    primary:
      'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 focus:ring-neutral-900 dark:focus:ring-white',
    secondary:
      'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 focus:ring-neutral-500',
    outline:
      'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 focus:ring-neutral-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:focus:ring-red-500',
    ghost:
      'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:pointer-events-none disabled:opacity-50 dark:focus:ring-offset-neutral-950',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

