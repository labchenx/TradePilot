import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { ProfitLossNumber, StatCard } from '@/components/common';
import type { CashFlow } from '@/types';
import { formatCurrency } from '@/utils';

interface CashFlowSummaryProps {
  cashFlows: CashFlow[];
}

export function CashFlowSummary({ cashFlows }: CashFlowSummaryProps) {
  const totalDeposit = cashFlows.filter((flow) => flow.type === 'DEPOSIT').reduce((sum, flow) => sum + flow.amount, 0);
  const totalWithdraw = Math.abs(cashFlows.filter((flow) => flow.type === 'WITHDRAW').reduce((sum, flow) => sum + flow.amount, 0));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Deposit 总入金"
        value={
          <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
            <ArrowDownToLine className="h-5 w-5" />
            {formatCurrency(totalDeposit)}
          </span>
        }
      />
      <StatCard
        title="Total Withdraw 总出金"
        value={
          <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
            <ArrowUpFromLine className="h-5 w-5" />
            {formatCurrency(totalWithdraw)}
          </span>
        }
      />
      <StatCard title="Net Deposit 净入金" value={<ProfitLossNumber amount={totalDeposit - totalWithdraw} className="text-2xl" />} />
      <StatCard title="Cash Balance 现金余额" value={formatCurrency(6140.32)} />
    </div>
  );
}

