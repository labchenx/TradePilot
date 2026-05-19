import { useMemo, useState } from 'react';
import { ArrowRight, Download, Search } from 'lucide-react';
import { Link } from 'react-router';
import {
  Button,
  CardShell,
  Input,
  ProfitLossNumber,
} from '@/components/common';
import type { Holding, HoldingSortKey, SortDirection } from '@/types';
import { formatCurrency } from '@/utils';

interface HoldingsTableProps {
  holdings: Holding[];
  loading?: boolean;
}

const sortableColumns: Record<HoldingSortKey, string> = {
  symbol: '股票 / 名称',
  quantity: '持仓数量',
  marketValue: '市值',
  unrealizedPnl: '未实现盈亏',
  unrealizedReturnRate: '收益率',
  weight: '持仓占比',
};

function nullableCurrency(value: number | null | undefined, currency = 'USD') {
  return value === null || value === undefined ? '--' : formatCurrency(value, currency);
}

function nullablePercent(value: number | null | undefined) {
  return value === null || value === undefined ? '--' : `${(value * 100).toFixed(2)}%`;
}

function getComparableValue(holding: Holding, key: HoldingSortKey) {
  if (key === 'symbol') return holding.symbol;
  return holding[key] ?? Number.NEGATIVE_INFINITY;
}

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return text.includes(',') || text.includes('"') || text.includes('\n')
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

function exportHoldingsCsv(holdings: Holding[]) {
  const header = [
    'symbol',
    'name',
    'quantity',
    'avgCost',
    'marketPrice',
    'costBasis',
    'marketValue',
    'unrealizedPnl',
    'unrealizedReturnRate',
    'weight',
    'currency',
  ];
  const rows = holdings.map((holding) =>
    [
      holding.symbol,
      holding.name ?? '',
      holding.quantity,
      holding.avgCost,
      holding.marketPrice,
      holding.costBasis,
      holding.marketValue,
      holding.unrealizedPnl,
      holding.unrealizedReturnRate,
      holding.weight,
      holding.currency,
    ]
      .map(csvEscape)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tradepilot-holdings.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function HoldingsTable({ holdings, loading }: HoldingsTableProps) {
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState<HoldingSortKey>('marketValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const visibleHoldings = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const filtered = keyword
      ? holdings.filter((holding) =>
          [holding.symbol, holding.name ?? ''].some((value) =>
            value.toLowerCase().includes(keyword),
          ),
        )
      : holdings;

    return [...filtered].sort((a, b) => {
      const left = getComparableValue(a, sortKey);
      const right = getComparableValue(b, sortKey);
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (typeof left === 'string' && typeof right === 'string') {
        return left.localeCompare(right) * direction;
      }

      return ((left as number) - (right as number)) * direction;
    });
  }, [holdings, searchText, sortDirection, sortKey]);

  function handleSort(nextSortKey: HoldingSortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === 'symbol' ? 'asc' : 'desc');
  }

  return (
    <CardShell className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50 md:flex-row md:items-center md:justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          持仓明细
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="pl-9"
              placeholder="搜索股票代码或名称"
            />
          </div>
          <select
            value={`${sortKey}:${sortDirection}`}
            onChange={(event) => {
              const [nextKey, nextDirection] = event.target.value.split(':') as [
                HoldingSortKey,
                SortDirection,
              ];
              setSortKey(nextKey);
              setSortDirection(nextDirection);
            }}
            className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
            aria-label="持仓排序"
          >
            <option value="marketValue:desc">市值从高到低</option>
            <option value="unrealizedPnl:desc">未实现盈亏从高到低</option>
            <option value="unrealizedPnl:asc">未实现盈亏从低到高</option>
            <option value="unrealizedReturnRate:desc">收益率从高到低</option>
            <option value="weight:desc">持仓占比从高到低</option>
            <option value="symbol:asc">股票代码 A 到 Z</option>
            <option value="quantity:desc">持仓数量从高到低</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => exportHoldingsCsv(visibleHoldings)}
            disabled={visibleHoldings.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            导出 CSV
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              {(['symbol', 'quantity'] as HoldingSortKey[]).map((key) => (
                <th key={key} className={`px-6 py-4 font-medium ${key === 'symbol' ? '' : 'text-right'}`}>
                  <button type="button" className="inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white" onClick={() => handleSort(key)}>
                    {sortableColumns[key]}
                    {sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : null}
                  </button>
                </th>
              ))}
              <th className="px-6 py-4 text-right font-medium">平均成本</th>
              <th className="px-6 py-4 text-right font-medium">市场价格</th>
              <th className="px-6 py-4 text-right font-medium">总成本</th>
              {(['marketValue', 'unrealizedPnl', 'weight'] as HoldingSortKey[]).map((key) => (
                <th key={key} className="px-6 py-4 text-right font-medium">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white" onClick={() => handleSort(key)}>
                    {sortableColumns[key]}
                    {sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : null}
                  </button>
                </th>
              ))}
              <th className="px-6 py-4 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
                >
                  正在加载持仓数据...
                </td>
              </tr>
            ) : visibleHoldings.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
                >
                  暂无当前持仓。导入交易记录后，这里会展示你的股票持仓、市值和盈亏。
                </td>
              </tr>
            ) : (
              visibleHoldings.map((holding) => (
                <tr
                  key={holding.id}
                  className="group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: holding.color }}
                        />
                        {holding.symbol}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {holding.name ?? '--'}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums text-neutral-900 dark:text-white">
                    {holding.quantity}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                    {nullableCurrency(holding.avgCost, holding.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-medium tabular-nums text-neutral-900 dark:text-white">
                    {nullableCurrency(holding.marketPrice, holding.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                    {nullableCurrency(holding.costBasis, holding.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-bold tabular-nums text-neutral-900 dark:text-white">
                    {nullableCurrency(holding.marketValue, holding.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    {holding.unrealizedPnl === null ? (
                      <span className="text-neutral-400">--</span>
                    ) : (
                      <ProfitLossNumber
                        amount={holding.unrealizedPnl}
                        percentage={
                          holding.unrealizedReturnRate === null
                            ? undefined
                            : holding.unrealizedReturnRate * 100
                        }
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                    {nullablePercent(holding.weight)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <Link
                      to={`/stock/${holding.symbol}`}
                      className="inline-flex items-center justify-center rounded-md p-1.5 text-blue-600 transition-colors hover:bg-blue-50 focus:opacity-100 dark:text-blue-400 dark:hover:bg-blue-900/30 md:opacity-0 md:group-hover:opacity-100"
                      aria-label={`查看 ${holding.symbol}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}
