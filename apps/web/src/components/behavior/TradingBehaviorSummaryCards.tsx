import { ProfitLossNumber, StatCard } from '@/components/common';
import type { TradingBehaviorSummary } from '@/types';
import { formatCurrency } from '@/utils';

interface TradingBehaviorSummaryCardsProps {
  summary?: TradingBehaviorSummary;
  loading: boolean;
}

function dash() {
  return <span className="text-neutral-400">--</span>;
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function formatRate(value: number | null | undefined) {
  if (value === null || value === undefined) return dash();
  return `${(value * 100).toFixed(1)}%`;
}

function nullableCurrency(value: number | null | undefined) {
  return value === null || value === undefined ? dash() : formatCurrency(value);
}

export function TradingBehaviorSummaryCards({
  summary,
  loading,
}: TradingBehaviorSummaryCardsProps) {
  const placeholder = loading ? '加载中...' : dash();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="总交易次数"
        value={loading || !summary ? placeholder : formatNumber(summary.totalTrades)}
        subValue="BUY + SELL"
      />
      <StatCard
        title="买入次数"
        value={loading || !summary ? placeholder : formatNumber(summary.buyTrades)}
        subValue="BUY 交易"
      />
      <StatCard
        title="卖出次数"
        value={loading || !summary ? placeholder : formatNumber(summary.sellTrades)}
        subValue="SELL 交易"
      />
      <StatCard
        title="交易股票数"
        value={
          loading || !summary ? placeholder : formatNumber(summary.tradedSymbolCount)
        }
        subValue="去重 symbol"
      />
      <StatCard
        title="总手续费"
        value={
          loading || !summary ? placeholder : formatCurrency(summary.totalCommission)
        }
        subValue="按绝对值统计"
      />
      <StatCard
        title="已实现盈亏"
        value={
          loading || !summary ? (
            placeholder
          ) : (
            <ProfitLossNumber amount={summary.realizedPnl} />
          )
        }
      />
      <StatCard
        title="平均单笔交易金额"
        value={
          loading || !summary ? placeholder : nullableCurrency(summary.avgTradeAmount)
        }
        subValue="按成交金额统计"
      />
      <StatCard
        title="胜率"
        value={loading || !summary ? placeholder : formatRate(summary.winRate)}
        subValue="SELL realizedPnl > 0"
      />
    </div>
  );
}
