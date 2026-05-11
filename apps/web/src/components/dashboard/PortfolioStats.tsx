import type { DashboardStat } from '@/types';
import { formatCurrency, formatPercent } from '@/utils';
import { ProfitLossNumber, StatCard } from '@/components/common';

interface PortfolioStatsProps {
  stats: DashboardStat[];
}

export function PortfolioStats({ stats }: PortfolioStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => {
        const value = stat.percent ? (
          <span className={stat.positive ? 'text-green-600 dark:text-green-400' : undefined}>
            {formatPercent(stat.value)}
          </span>
        ) : stat.positive ? (
          <ProfitLossNumber amount={stat.value} className="text-2xl" />
        ) : (
          formatCurrency(stat.value, stat.currency)
        );

        return <StatCard key={stat.label} title={stat.label} value={value} trend={stat.positive ? 'up' : undefined} />;
      })}
    </div>
  );
}

