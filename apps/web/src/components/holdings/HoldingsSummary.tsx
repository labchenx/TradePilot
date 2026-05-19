import { ProfitLossNumber, StatCard } from '@/components/common';
import type { HoldingsSummaryApiDto } from '@/types';
import { formatCurrency } from '@/utils';

interface HoldingsSummaryProps {
  summary?: HoldingsSummaryApiDto;
  loading?: boolean;
}

function nullableCurrency(value: number | null | undefined) {
  return value === null || value === undefined ? '--' : formatCurrency(value);
}

function nullablePercent(value: number | null | undefined) {
  return value === null || value === undefined ? undefined : value * 100;
}

export function HoldingsSummary({ summary, loading }: HoldingsSummaryProps) {
  const placeholder = loading ? '加载中...' : '--';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="持仓数量"
        value={summary?.numberOfHoldings ?? placeholder}
      />
      <StatCard
        title="总市值"
        value={loading ? placeholder : nullableCurrency(summary?.totalMarketValue)}
      />
      <StatCard
        title="总成本"
        value={loading ? placeholder : nullableCurrency(summary?.totalCost)}
      />
      <StatCard
        title="未实现盈亏"
        value={
          summary?.unrealizedPnl === null || summary?.unrealizedPnl === undefined ? (
            placeholder
          ) : (
            <ProfitLossNumber
              amount={summary.unrealizedPnl}
              percentage={nullablePercent(summary.unrealizedReturnRate)}
              className="text-2xl"
            />
          )
        }
        trend={
          summary?.unrealizedPnl === undefined || summary.unrealizedPnl === null
            ? undefined
            : summary.unrealizedPnl >= 0
              ? 'up'
              : 'down'
        }
      />
    </div>
  );
}
