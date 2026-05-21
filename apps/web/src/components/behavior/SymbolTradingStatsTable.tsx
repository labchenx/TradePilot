import { CardShell, ProfitLossNumber } from '@/components/common';
import type { SymbolTradingStats } from '@/types';
import { formatCurrency } from '@/utils';

interface SymbolTradingStatsTableProps {
  rows: SymbolTradingStats[];
  loading: boolean;
}

export function SymbolTradingStatsTable({
  rows,
  loading,
}: SymbolTradingStatsTableProps) {
  return (
    <CardShell className="overflow-hidden">
      <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          个股交易活跃度排行
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          默认按 tradeCount 从高到低排序，只统计 BUY / SELL
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Symbol</th>
              <th className="px-6 py-4 text-right font-medium">Trades</th>
              <th className="px-6 py-4 text-right font-medium">BUY</th>
              <th className="px-6 py-4 text-right font-medium">SELL</th>
              <th className="px-6 py-4 text-right font-medium">Buy Amount</th>
              <th className="px-6 py-4 text-right font-medium">Sell Amount</th>
              <th className="px-6 py-4 text-right font-medium">Commission</th>
              <th className="px-6 py-4 text-right font-medium">Realized P/L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-center text-neutral-500" colSpan={8}>
                  个股活跃度加载中...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-neutral-500" colSpan={8}>
                  暂无个股交易活跃度数据
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.symbol}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {row.symbol}
                    </div>
                    {row.name && row.name !== row.symbol ? (
                      <div className="text-xs text-neutral-500">{row.name}</div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {row.tradeCount}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {row.buyCount}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {row.sellCount}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {formatCurrency(row.buyAmount)}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {formatCurrency(row.sellAmount)}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {formatCurrency(row.commission)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ProfitLossNumber amount={row.realizedPnl} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}
