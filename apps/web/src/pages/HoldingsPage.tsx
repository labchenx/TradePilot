import { PageTitle } from '@/components/common';
import {
  HoldingsAllocationChart,
  HoldingsPnlChart,
  HoldingsSummary,
  HoldingsTable,
} from '@/components/holdings';
import { useHoldings } from '@/hooks';

export function HoldingsPage() {
  const holdings = useHoldings();

  return (
    <div className="space-y-6">
      <PageTitle
        title="Positions 当前持仓"
        description="Review current portfolio holdings, cost basis, and unrealized profits"
      />
      <HoldingsSummary holdings={holdings} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HoldingsAllocationChart holdings={holdings} />
        <HoldingsPnlChart holdings={holdings} />
      </div>
      <HoldingsTable holdings={holdings} />
    </div>
  );
}

