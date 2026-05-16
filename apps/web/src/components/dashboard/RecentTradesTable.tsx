import { Link } from 'react-router';
import { CardShell, Tag } from '@/components/common';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/utils';

interface RecentTradesTableProps {
  transactions: Transaction[];
}

export function RecentTradesTable({ transactions }: RecentTradesTableProps) {
  return (
    <CardShell className="overflow-hidden rounded-[14px] shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-5 dark:border-neutral-800">
        <h3 className="text-lg leading-7 font-semibold text-neutral-900 dark:text-white">Recent Trades 最近交易</h3>
        <Link to="/transactions" className="text-sm leading-5 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs leading-4 font-medium tracking-normal text-neutral-500 uppercase dark:bg-neutral-900/70 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Symbol</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 text-right font-medium">Qty</th>
              <th className="px-6 py-3 text-right font-medium">Price</th>
              <th className="px-6 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                  No recent trades
                </td>
              </tr>
            ) : null}
            {transactions.map((trade) => (
              <tr key={trade.id} className="h-[54px] hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">{trade.tradeDate}</td>
                <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">{trade.symbol}</td>
                <td className="px-6 py-4">
                  <Tag color={trade.side === 'BUY' ? 'green' : 'red'}>{trade.side}</Tag>
                </td>
                <td className="px-6 py-4 text-right font-medium tabular-nums text-neutral-900 dark:text-white">{trade.quantity}</td>
                <td className="px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">{formatCurrency(trade.price)}</td>
                <td className="px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">{formatCurrency(trade.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}
