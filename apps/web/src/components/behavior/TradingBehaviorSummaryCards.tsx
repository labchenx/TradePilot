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
        title="Total Trades"
        value={loading || !summary ? placeholder : formatNumber(summary.totalTrades)}
        subValue="总交易次数"
      />
      <StatCard
        title="Buy Trades"
        value={loading || !summary ? placeholder : formatNumber(summary.buyTrades)}
        subValue="买入次数"
      />
      <StatCard
        title="Sell Trades"
        value={loading || !summary ? placeholder : formatNumber(summary.sellTrades)}
        subValue="卖出次数"
      />
      <StatCard
        title="Traded Symbols"
        value={
          loading || !summary ? placeholder : formatNumber(summary.tradedSymbolCount)
        }
        subValue="交易股票数"
      />
      <StatCard
        title="Total Commission"
        value={
          loading || !summary ? placeholder : formatCurrency(summary.totalCommission)
        }
        subValue="总手续费"
      />
      <StatCard
        title="Realized P/L"
        value={
          loading || !summary ? (
            placeholder
          ) : (
            <ProfitLossNumber amount={summary.realizedPnl} />
          )
        }
      />
      <StatCard
        title="Avg Trade Amount"
        value={
          loading || !summary ? placeholder : nullableCurrency(summary.avgTradeAmount)
        }
        subValue="平均单笔交易金额"
      />
      <StatCard
        title="Win Rate"
        value={loading || !summary ? placeholder : formatRate(summary.winRate)}
        subValue="SELL realizedPnl > 0"
      />
    </div>
  );
}
