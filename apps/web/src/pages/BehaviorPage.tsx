import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, PageTitle } from '@/components/common';
import {
  BehaviorFrequencyChart,
  MonthlyTradeAmountChart,
  RealizedPnlContributionChart,
  SymbolTradingStatsTable,
  TradingBehaviorFilters,
  TradingBehaviorSummaryCards,
} from '@/components/behavior';
import { useTradingBehavior } from '@/hooks';

export function BehaviorPage() {
  const {
    data,
    loading,
    error,
    query,
    updateQuery,
    resetQuery,
    refetch,
  } = useTradingBehavior();
  const warnings = data?.warnings ?? [];
  const isEmpty = !loading && !error && (data?.summary.totalTrades ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageTitle
          title="交易行为分析"
          description="从数据库中的 BUY / SELL 交易分析交易频率、买卖金额、活跃股票、手续费、胜率和已实现盈亏贡献"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => void refetch()}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      <TradingBehaviorFilters
        query={query}
        loading={loading}
        onQueryChange={updateQuery}
        onReset={resetQuery}
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold">交易行为数据加载失败</p>
          <p className="mt-1">{error}</p>
          <Button
            variant="danger"
            size="sm"
            className="mt-3"
            onClick={() => void refetch()}
          >
            重试
          </Button>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            数据提醒
          </div>
          <ul className="space-y-1">
            {warnings.slice(0, 5).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          {warnings.length > 5 ? (
            <p className="mt-2 text-xs">
              还有 {warnings.length - 5} 条提醒未展示。
            </p>
          ) : null}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          暂无交易行为数据
        </div>
      ) : null}

      <TradingBehaviorSummaryCards
        summary={data?.summary}
        loading={loading}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <BehaviorFrequencyChart
          data={data?.monthlyTradeCounts ?? []}
          loading={loading}
        />
        <RealizedPnlContributionChart
          data={data?.realizedPnlContributions ?? []}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MonthlyTradeAmountChart
          data={data?.monthlyTradeAmounts ?? []}
          loading={loading}
        />
      </div>

      <SymbolTradingStatsTable
        rows={data?.symbolStats ?? []}
        loading={loading}
      />
    </div>
  );
}
