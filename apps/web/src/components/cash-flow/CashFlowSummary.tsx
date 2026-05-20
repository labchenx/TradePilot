import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  type LucideIcon,
} from 'lucide-react';
import { ProfitLossNumber, StatCard } from '@/components/common';
import type { CashFlowSummary as CashFlowSummaryData } from '@/types';
import { formatCurrency } from '@/utils';

interface CashFlowSummaryProps {
  summary?: CashFlowSummaryData;
  loading?: boolean;
}

const emptySummary: CashFlowSummaryData = {
  totalDeposits: 0,
  totalWithdrawals: 0,
  cashBalance: 0,
  netDeposit: 0,
  currency: 'USD',
};

function SummaryValue({
  icon: Icon,
  value,
  currency,
  tone,
}: {
  icon: LucideIcon;
  value: number;
  currency: string;
  tone?: 'positive' | 'negative';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : tone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-neutral-900 dark:text-white';

  return (
    <span className={`flex items-center gap-2 font-semibold ${toneClass}`}>
      <Icon className="h-5 w-5 shrink-0" />
      {formatCurrency(value, currency)}
    </span>
  );
}

export function CashFlowSummary({ summary, loading }: CashFlowSummaryProps) {
  const data = summary ?? emptySummary;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[118px] animate-pulse rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="总入金"
        value={
          <SummaryValue
            icon={ArrowDownToLine}
            value={data.totalDeposits}
            currency={data.currency}
            tone="positive"
          />
        }
      />
      <StatCard
        title="总出金"
        value={
          <SummaryValue
            icon={ArrowUpFromLine}
            value={data.totalWithdrawals}
            currency={data.currency}
            tone="negative"
          />
        }
      />
      <StatCard
        title="现金余额"
        value={
          <SummaryValue
            icon={Banknote}
            value={data.cashBalance}
            currency={data.currency}
            tone={data.cashBalance < 0 ? 'negative' : undefined}
          />
        }
      />
      <StatCard
        title="净入金"
        value={
          <span className="text-2xl">
            <ProfitLossNumber amount={data.netDeposit} />
          </span>
        }
        subValue="入金 + 出金"
        trend="neutral"
      />
    </div>
  );
}
