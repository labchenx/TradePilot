import { CardShell, Tag } from '@/components/common';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/utils';
import { TablePagination } from './TablePagination';
import { TransactionFilters } from './TransactionFilters';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <CardShell className="overflow-hidden">
      <TransactionFilters />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Trade Date</th>
              <th className="px-6 py-4 font-medium">Symbol / Name</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 text-right font-medium">Quantity</th>
              <th className="px-6 py-4 text-right font-medium">Price</th>
              <th className="px-6 py-4 text-right font-medium">Fee</th>
              <th className="px-6 py-4 text-right font-medium">Amount</th>
              <th className="px-6 py-4 text-center font-medium">Source</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {transactions.map((trade) => (
              <tr key={trade.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="whitespace-nowrap px-6 py-4 text-neutral-600 dark:text-neutral-300">{trade.tradeDate}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-neutral-900 dark:text-white">{trade.symbol}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{trade.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Tag color={trade.side === 'BUY' ? 'green' : 'red'}>{trade.side}</Tag>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-medium tabular-nums text-neutral-900 dark:text-white">
                  {trade.quantity}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">
                  {formatCurrency(trade.price)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                  {formatCurrency(trade.fee)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-medium tabular-nums text-neutral-900 dark:text-white">
                  {formatCurrency(trade.amount)} <span className="text-xs text-neutral-400">{trade.currency}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <Tag color={trade.source === 'EMAIL' ? 'blue' : 'gray'}>{trade.source}</Tag>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button type="button" className="mr-3 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    Edit
                  </button>
                  <button type="button" className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination />
    </CardShell>
  );
}

