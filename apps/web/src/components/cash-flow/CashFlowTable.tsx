import { CardShell, ProfitLossNumber, Tag } from '@/components/common';
import type { CashFlow } from '@/types';
import { CashFlowFilters } from './CashFlowFilters';

interface CashFlowTableProps {
  cashFlows: CashFlow[];
}

const tagColors = {
  DEPOSIT: 'green',
  WITHDRAW: 'red',
  DIVIDEND: 'blue',
  FEE: 'gray',
} as const;

export function CashFlowTable({ cashFlows }: CashFlowTableProps) {
  return (
    <CardShell className="overflow-hidden">
      <CashFlowFilters />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 text-right font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Broker</th>
              <th className="px-6 py-4 font-medium">Source / Ref</th>
              <th className="px-6 py-4 font-medium">Note</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {cashFlows.map((flow) => (
              <tr key={flow.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="whitespace-nowrap px-6 py-4 text-neutral-600 dark:text-neutral-300">{flow.flowDate}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Tag color={tagColors[flow.type]}>{flow.type}</Tag>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums">
                  <ProfitLossNumber amount={flow.amount} /> <span className="ml-1 text-xs font-normal text-neutral-400">{flow.currency}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-neutral-900 dark:text-white">{flow.broker}</td>
                <td className="whitespace-nowrap px-6 py-4 text-neutral-600 dark:text-neutral-300">{flow.source}</td>
                <td className="max-w-[200px] truncate px-6 py-4 text-neutral-500 dark:text-neutral-400" title={flow.note}>{flow.note}</td>
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
    </CardShell>
  );
}

