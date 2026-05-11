import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router';
import { Button, CardShell, ProfitLossNumber } from '@/components/common';
import type { Holding } from '@/types';
import { formatCurrency } from '@/utils';

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);

  return (
    <CardShell className="overflow-hidden">
      <div className="flex items-center justify-between rounded-t-xl border-b border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Holdings Detail</h3>
        <Button variant="outline" size="sm" className="h-9">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Symbol / Name</th>
              <th className="px-6 py-4 text-right font-medium">Shares</th>
              <th className="px-6 py-4 text-right font-medium">Avg Cost</th>
              <th className="px-6 py-4 text-right font-medium">Mkt Price</th>
              <th className="px-6 py-4 text-right font-medium">Total Cost</th>
              <th className="px-6 py-4 text-right font-medium">Mkt Value</th>
              <th className="px-6 py-4 text-right font-medium">Unrealized P/L</th>
              <th className="px-6 py-4 text-right font-medium">% of Port</th>
              <th className="px-6 py-4 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {holdings.map((holding) => (
              <tr key={holding.id} className="group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: holding.color }} />
                      {holding.symbol}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{holding.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums text-neutral-900 dark:text-white">{holding.quantity}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-600 dark:text-neutral-300">{formatCurrency(holding.averageCost)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-medium tabular-nums text-neutral-900 dark:text-white">{formatCurrency(holding.currentPrice)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-500 dark:text-neutral-400">{formatCurrency(holding.quantity * holding.averageCost)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-bold tabular-nums text-neutral-900 dark:text-white">{formatCurrency(holding.marketValue)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <ProfitLossNumber amount={holding.unrealizedPnl} percentage={holding.unrealizedPnlPercent} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                  {((holding.marketValue / totalValue) * 100).toFixed(1)}%
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <Link
                    to={`/stock/${holding.symbol}`}
                    className="inline-flex items-center justify-center rounded-md p-1.5 text-blue-600 transition-colors hover:bg-blue-50 focus:opacity-100 dark:text-blue-400 dark:hover:bg-blue-900/30 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}

