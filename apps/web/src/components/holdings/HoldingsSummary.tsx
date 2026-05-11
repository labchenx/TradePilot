import { ProfitLossNumber, StatCard } from '@/components/common';
import type { Holding } from '@/types';
import { formatCurrency } from '@/utils';

interface HoldingsSummaryProps {
  holdings: Holding[];
}

export function HoldingsSummary({ holdings }: HoldingsSummaryProps) {
  const marketValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const totalCost = holdings.reduce((sum, holding) => sum + holding.quantity * holding.averageCost, 0);
  const unrealizedPnl = holdings.reduce((sum, holding) => sum + holding.unrealizedPnl, 0);
  const unrealizedPnlPercent = (unrealizedPnl / totalCost) * 100;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Number of Holdings 持仓数" value={holdings.length} />
      <StatCard title="Total Market Value 总市值" value={formatCurrency(marketValue)} />
      <StatCard title="Total Cost 总成本" value={formatCurrency(totalCost)} />
      <StatCard
        title="Unrealized P/L 未实现盈亏"
        value={<ProfitLossNumber amount={unrealizedPnl} percentage={unrealizedPnlPercent} className="text-2xl" />}
        trend="up"
      />
    </div>
  );
}

