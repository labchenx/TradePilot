import { useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import { useTransactions } from '@/hooks';
import { cn } from '@/utils';
import { MobileEmpty, MobileError, MobileLoading } from './MobileState';
import { dateText, money } from './mobileFormat';

export function MobileTrades() {
  const { data, loading, error, query, updateQuery, resetQuery, exportTransactions, exporting, exportError } = useTransactions();
  const [showFilters, setShowFilters] = useState(false);
  const transactions = data?.transactions ?? [];
  const hasActiveFilters =
    Boolean(query.search.trim()) ||
    query.side !== 'ALL' ||
    query.sortBy !== 'date' ||
    query.sortDirection !== 'desc';

  if (loading && !data) return <MobileLoading label="加载交易明细..." />;
  if (error) return <MobileError message={error} />;

  return (
    <div className="space-y-4">
      {exportError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold">导出失败</p>
          <p className="mt-1">{exportError}</p>
        </div>
      ) : null}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <input
            type="search"
            value={query.search}
            onChange={(event) => updateQuery({ search: event.target.value })}
            placeholder="搜索 symbol..."
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white pr-3 pl-9 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </div>
        <select
          value={query.side}
          onChange={(event) =>
            updateQuery({ side: event.target.value as typeof query.side })
          }
          className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          aria-label="交易方向筛选"
        >
          <option value="ALL">ALL</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <button
          type="button"
          onClick={() => setShowFilters((current) => !current)}
          className={cn(
            'relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
            showFilters || hasActiveFilters
              ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300'
              : 'border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400',
          )}
          aria-label="打开筛选"
          aria-expanded={showFilters}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters ? (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-300" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => void exportTransactions()}
          disabled={exporting}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
          aria-label="导出 CSV"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {showFilters ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              筛选与排序
            </h3>
            <button
              type="button"
              onClick={resetQuery}
              className="text-xs font-medium text-blue-600 dark:text-blue-400"
            >
              重置
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                交易方向
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['ALL', 'BUY', 'SELL'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => updateQuery({ side })}
                    className={cn(
                      'h-9 rounded-xl border text-sm font-semibold transition-colors',
                      query.side === side
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-300',
                    )}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className="block">
                <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
                  排序字段
                </span>
                <select
                  value={query.sortBy}
                  onChange={(event) =>
                    updateQuery({ sortBy: event.target.value as typeof query.sortBy })
                  }
                  className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-300"
                >
                  <option value="date">日期</option>
                  <option value="amount">金额</option>
                  <option value="realizedPnl">realizedPnl</option>
                  <option value="symbol">symbol</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-neutral-500 dark:text-neutral-400">
                  顺序
                </span>
                <select
                  value={query.sortDirection}
                  onChange={(event) =>
                    updateQuery({
                      sortDirection: event.target.value as typeof query.sortDirection,
                    })
                  }
                  className="h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-300"
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </label>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-end justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
          <div>
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">总交易</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {data?.summary.totalTrades ?? 0}
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            当前筛选结果
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-green-50 px-3 py-2 dark:bg-green-950/20">
            <p className="shrink-0 text-xs text-green-700 dark:text-green-300">买入额</p>
            <p className="min-w-0 break-words text-right text-base font-bold leading-tight text-green-600 dark:text-green-400">
              {money(data?.summary.buyAmount ?? 0)}
            </p>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-950/20">
            <p className="shrink-0 text-xs text-red-700 dark:text-red-300">卖出额</p>
            <p className="min-w-0 break-words text-right text-base font-bold leading-tight text-red-600 dark:text-red-400">
              {money(data?.summary.sellAmount ?? 0)}
            </p>
          </div>
        </div>
      </section>

      {transactions.length === 0 ? (
        <MobileEmpty
          title="暂无交易记录"
          description="当前筛选条件下没有交易。你可以调整搜索关键词或导入交易数据。"
        />
      ) : (
        <div className="space-y-3">
          {transactions.slice(0, 30).map((trade) => {
            const isBuy = trade.side === 'BUY';

            return (
              <article
                key={trade.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-bold',
                        isBuy
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      )}
                    >
                      {trade.side}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-neutral-900 dark:text-white">
                        {trade.symbol}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {trade.name || trade.sourceFileName || trade.source}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-white">
                      {money(trade.amount, trade.currency)}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {dateText(trade.date)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  <div>
                    <p className="mb-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">quantity</p>
                    <p className="text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
                      {trade.quantity?.toLocaleString() ?? '--'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">price</p>
                    <p className="text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
                      {money(trade.price, trade.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">fee</p>
                    <p className="text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
                      {money(trade.commission, trade.currency)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
