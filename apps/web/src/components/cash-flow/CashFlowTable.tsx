import type { Dispatch, SetStateAction } from 'react';
import { CardShell, ProfitLossNumber, Tag } from '@/components/common';
import type { CashFlow, CashFlowFiltersState, CashFlowType } from '@/types';
import { CashFlowFilters } from './CashFlowFilters';

interface CashFlowTableProps {
  cashFlows: CashFlow[];
  filters: CashFlowFiltersState;
  setFilters: Dispatch<SetStateAction<CashFlowFiltersState>>;
  onResetFilters: () => void;
  onExportCsv: () => void;
  loading?: boolean;
}

const tagColors: Record<CashFlowType, 'green' | 'red' | 'blue' | 'gray'> = {
  Deposit: 'green',
  Withdrawal: 'red',
};

const typeLabels: Record<CashFlowType, string> = {
  Deposit: '入金',
  Withdrawal: '出金',
};

export function CashFlowTable({
  cashFlows,
  filters,
  setFilters,
  onResetFilters,
  onExportCsv,
  loading,
}: CashFlowTableProps) {
  return (
    <CardShell className="overflow-hidden">
      <CashFlowFilters
        filters={filters}
        setFilters={setFilters}
        onReset={onResetFilters}
        onExport={onExportCsv}
        exportDisabled={cashFlows.length === 0}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">日期</th>
              <th className="px-6 py-4 font-medium">类型</th>
              <th className="px-6 py-4 text-right font-medium">金额</th>
              <th className="px-6 py-4 font-medium">币种</th>
              <th className="px-6 py-4 font-medium">备注 / 来源</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={5} className="px-6 py-3">
                    <div className="h-8 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800" />
                  </td>
                </tr>
              ))
            ) : cashFlows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    没有找到现金流水记录。
                  </p>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    可以调整筛选条件，或先导入并确认 IBKR 记录。
                  </p>
                </td>
              </tr>
            ) : (
              cashFlows.map((flow) => (
              <tr key={flow.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="whitespace-nowrap px-6 py-4 text-neutral-600 dark:text-neutral-300">{flow.date}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Tag color={tagColors[flow.type]}>{typeLabels[flow.type]}</Tag>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums">
                  <ProfitLossNumber amount={flow.amount} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-neutral-600 dark:text-neutral-300">
                  {flow.currency}
                </td>
                <td className="max-w-[320px] px-6 py-4 text-neutral-500 dark:text-neutral-400">
                  <div className="truncate" title={flow.remark}>
                    {flow.remark ?? '--'}
                  </div>
                  {flow.source ? (
                    <div className="mt-1 truncate text-xs text-neutral-400" title={flow.source}>
                      {flow.source}
                    </div>
                  ) : null}
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
