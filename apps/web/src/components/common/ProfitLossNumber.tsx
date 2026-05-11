import { cn, getPnLColorClass } from '@/utils';

interface ProfitLossNumberProps {
  amount: number;
  percentage?: number;
  className?: string;
}

export function ProfitLossNumber({ amount, percentage, className }: ProfitLossNumberProps) {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  const absAmount = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={cn('font-semibold tabular-nums', getPnLColorClass(amount), className)}>
      {sign}${absAmount}
      {percentage !== undefined ? (
        <span className="ml-1 text-xs">
          ({percentage > 0 ? '+' : ''}
          {percentage.toFixed(2)}%)
        </span>
      ) : null}
    </span>
  );
}

