import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, PageTitle } from '@/components/common';
import {
  HoldingsAllocationChart,
  HoldingsPnlChart,
  HoldingsSummary,
  HoldingsTable,
} from '@/components/holdings';
import { useHoldings } from '@/hooks';

export function HoldingsPage() {
  const { data, loading, error, refetch } = useHoldings();
  const warnings = data?.warnings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageTitle
          title="Positions 当前持仓"
          description="查看当前持仓、市值、成本基础和未实现盈亏"
        />
        <Button variant="outline" size="sm" className="h-9" onClick={refetch}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          持仓数据加载失败：{error}
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

      <HoldingsSummary summary={data?.summary} loading={loading} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HoldingsAllocationChart
          allocation={data?.allocation ?? []}
          totalMarketValue={data?.summary.totalMarketValue}
          loading={loading}
        />
        <HoldingsPnlChart
          pnlBySymbol={data?.pnlBySymbol ?? []}
          loading={loading}
        />
      </div>
      <HoldingsTable holdings={data?.holdings ?? []} loading={loading} />
    </div>
  );
}
