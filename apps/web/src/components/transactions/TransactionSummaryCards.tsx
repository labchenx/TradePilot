import { ProfitLossNumber, StatCard } from '@/components/common';
import type { TransactionSummaryApiDto } from '@/types';
import { formatCurrency } from '@/utils';

interface TransactionSummaryCardsProps {
  summary?: TransactionSummaryApiDto;
  loading?: boolean;
}

export function TransactionSummaryCards({
  summary,
  loading,
}: TransactionSummaryCardsProps) {
  const placeholder = loading ? '加载中...' : '--';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard
        title="总交易数"
        value={summary?.totalTrades ?? placeholder}
      />
      <StatCard
        title="买入总额"
        value={summary ? formatCurrency(summary.buyAmount) : placeholder}
      />
      <StatCard
        title="卖出总额"
        value={summary ? formatCurrency(summary.sellAmount) : placeholder}
      />
      <StatCard
        title="总佣金"
        value={summary ? formatCurrency(summary.commission) : placeholder}
      />
      <StatCard
        title="已实现盈亏"
        value={
          summary ? (
            <ProfitLossNumber amount={summary.realizedPnl} className="text-2xl" />
          ) : (
            placeholder
          )
        }
        trend={
          summary
            ? summary.realizedPnl >= 0
              ? 'up'
              : 'down'
            : undefined
        }
      />
      <StatCard
        title="交易股票数"
        value={summary?.tradedSymbolCount ?? placeholder}
      />
    </div>
  );
}
