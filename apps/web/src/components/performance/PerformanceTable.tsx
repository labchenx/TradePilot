import { CardShell, ProfitLossNumber } from '@/components/common';
import type { PerformanceRow } from '@/types';

interface PerformanceTableProps {
  rows: PerformanceRow[];
}

export function PerformanceTable({ rows }: PerformanceTableProps) {
  return (
    <CardShell className="overflow-hidden">
      <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">P/L Contribution 收益贡献</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Symbol</th>
              <th className="px-6 py-4 text-right font-medium">Realized P/L</th>
              <th className="px-6 py-4 text-right font-medium">Unrealized P/L</th>
              <th className="px-6 py-4 text-right font-medium">Total P/L</th>
              <th className="px-6 py-4 text-right font-medium">Contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {rows.map((row) => (
              <tr key={row.symbol} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">{row.symbol}</td>
                <td className="px-6 py-4 text-right"><ProfitLossNumber amount={row.realizedPnl} /></td>
                <td className="px-6 py-4 text-right"><ProfitLossNumber amount={row.unrealizedPnl} /></td>
                <td className="px-6 py-4 text-right"><ProfitLossNumber amount={row.totalPnl} /></td>
                <td className="px-6 py-4 text-right font-medium tabular-nums text-neutral-600 dark:text-neutral-300">{row.contributionPercent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}

