import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { CardShell } from './CardShell';

interface StatCardProps {
  title: string;
  value: ReactNode;
  subValue?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, subValue, trend }: StatCardProps) {
  return (
    <CardShell className="p-5">
      <h3 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</h3>
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
        {subValue ? (
          <div
            className={cn(
              'text-sm font-medium',
              trend === 'up' && 'text-green-600 dark:text-green-400',
              trend === 'down' && 'text-red-600 dark:text-red-400',
              trend === 'neutral' && 'text-neutral-500 dark:text-neutral-400',
            )}
          >
            {subValue}
          </div>
        ) : null}
      </div>
    </CardShell>
  );
}

