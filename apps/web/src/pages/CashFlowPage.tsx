import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, PageTitle } from '@/components/common';
import { CashFlowSummary, CashFlowTable } from '@/components/cash-flow';
import { useCashFlows } from '@/hooks';
import { downloadCashFlowsCsv } from '@/utils';

export function CashFlowPage() {
  const {
    data,
    items,
    filters,
    loading,
    error,
    setFilters,
    resetFilters,
    refetch,
  } = useCashFlows();
  const warnings = data?.warnings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageTitle
          title="现金流水"
          description="查看账户入金和出金明细，核验现金余额与净入金"
        />
        <Button variant="outline" size="sm" className="h-9" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          现金流水加载失败：{error}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            数据提醒
          </div>
          <ul className="space-y-1">
            {warnings.slice(0, 4).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <CashFlowSummary summary={data?.summary} loading={loading} />
      <CashFlowTable
        cashFlows={items}
        filters={filters}
        setFilters={setFilters}
        onResetFilters={resetFilters}
        onExportCsv={() => downloadCashFlowsCsv(items)}
        loading={loading}
      />
    </div>
  );
}
