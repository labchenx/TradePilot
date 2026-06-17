import { useState } from 'react';
import { AlertTriangle, CalendarPlus, RefreshCw } from 'lucide-react';
import { ManualFillDialog } from '@/components/dashboard';
import { Button, PageTitle } from '@/components/common';
import {
  TransactionDetailDrawer,
  TransactionSummaryCards,
  TransactionTable,
} from '@/components/transactions';
import { useTransactions } from '@/hooks';
import type { PortfolioTransactionApiDto } from '@/types';

export function TransactionsPage() {
  const {
    data,
    loading,
    error,
    query,
    updateQuery,
    resetQuery,
    updateTransactionSide,
    refetch,
  } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] =
    useState<PortfolioTransactionApiDto | null>(null);
  const [showManualFill, setShowManualFill] = useState(false);
  const warnings = data?.warnings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageTitle
          title="交易明细"
          description="查看股票买入 / 卖出记录，并通过 IBKR 原始记录排查持仓数量、成本和已实现盈亏。"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="h-9"
            onClick={() => setShowManualFill(true)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            手动补录
          </Button>
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
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold">交易明细加载失败</p>
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
              还有 {warnings.length - 5} 条提醒
            </p>
          ) : null}
        </div>
      ) : null}

      <TransactionSummaryCards summary={data?.summary} loading={loading} />

      <TransactionTable
        transactions={data?.transactions ?? []}
        pagination={data?.pagination}
        query={query}
        loading={loading}
        onQueryChange={updateQuery}
        onReset={resetQuery}
        onPageChange={(page) => updateQuery({ page })}
        onSelectTransaction={setSelectedTransaction}
      />

      <TransactionDetailDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onCorrectSide={async (id, side) => {
          const updated = await updateTransactionSide(id, side);
          setSelectedTransaction(updated);
          return updated;
        }}
      />
      {showManualFill ? (
        <ManualFillDialog
          onClose={() => setShowManualFill(false)}
          onSuccess={() => void refetch()}
        />
      ) : null}
    </div>
  );
}
