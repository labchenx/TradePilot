import type { ReactNode } from 'react';
import { CardShell } from '@/components/common';
import type { DashboardStat } from '@/types';
import { cn, formatCurrency, formatPercent } from '@/utils';

interface PortfolioStatsProps {
  stats: DashboardStat[];
}

function renderStatValue(stat: DashboardStat): ReactNode {
  if (stat.value === null) {
    return <span className="tabular-nums text-neutral-400 dark:text-neutral-500">--</span>;
  }

  if (stat.percent) {
    return (
      <span className={cn('tabular-nums', stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
        {formatPercent(stat.value)}
      </span>
    );
  }

  if (stat.positive !== undefined) {
    const sign = stat.value > 0 ? '+' : stat.value < 0 ? '-' : '';
    return (
      <span className={cn('tabular-nums', stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
        {sign}
        {formatCurrency(Math.abs(stat.value), stat.currency)}
      </span>
    );
  }

  return formatCurrency(stat.value, stat.currency);
}

export function PortfolioStats({ stats }: PortfolioStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <CardShell
          key={stat.label}
          className="flex min-h-[102px] flex-col justify-start rounded-[14px] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
        >
          <h3 className="text-sm leading-5 font-medium text-neutral-500 dark:text-neutral-400">{stat.label}</h3>
          <div className="mt-2 text-2xl leading-8 font-bold tracking-normal text-neutral-900 tabular-nums dark:text-white">
            {renderStatValue(stat)}
          </div>
          {stat.subtitle ? (
            <p className="mt-1 text-sm leading-5 font-medium text-neutral-500 dark:text-neutral-400">{stat.subtitle}</p>
          ) : null}
        </CardShell>
      ))}
    </div>
  );
}
