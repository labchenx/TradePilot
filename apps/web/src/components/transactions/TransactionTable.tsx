import { Eye } from 'lucide-react';
import { Button, CardShell, ProfitLossNumber, Tag } from '@/components/common';
import type {
  PortfolioTransactionApiDto,
  TransactionListQuery,
  TransactionsPaginationApiDto,
} from '@/types';
import { formatCurrency } from '@/utils';
import { TablePagination } from './TablePagination';
import { TransactionFilters } from './TransactionFilters';

interface TransactionTableProps {
  transactions: PortfolioTransactionApiDto[];
  pagination?: TransactionsPaginationApiDto;
  query: TransactionListQuery;
  loading?: boolean;
  onQueryChange: (patch: Partial<TransactionListQuery>) => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
  onSelectTransaction: (transaction: PortfolioTransactionApiDto) => void;
}

function nullableCurrency(
  value: number | null | undefined,
  currency = 'USD',
) {
  return value === null || value === undefined ? '--' : formatCurrency(value, currency);
}

function signedCurrency(value: number, currency = 'USD') {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatCurrency(Math.abs(value), currency)}`;
}

export function TransactionTable({
  transactions,
  pagination,
  query,
  loading,
  onQueryChange,
  onReset,
  onPageChange,
  onSelectTransaction,
}: TransactionTableProps) {
  const colSpan = 11;

  return (
    <CardShell className="overflow-hidden">
      <TransactionFilters
        query={query}
        loading={loading}
        onChange={onQueryChange}
        onReset={onReset}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">日期</th>
              <th className="px-6 py-4 font-medium">股票代码 / 名称</th>
              <th className="px-6 py-4 font-medium">方向</th>
              <th className="px-6 py-4 text-right font-medium">数量</th>
              <th className="px-6 py-4 text-right font-medium">成交价</th>
              <th className="px-6 py-4 text-right font-medium">成交金额</th>
              <th className="px-6 py-4 text-right font-medium">佣金</th>
              <th className="px-6 py-4 text-right font-medium">已实现盈亏</th>
              <th className="px-6 py-4 text-center font-medium">币种</th>
              <th className="px-6 py-4 text-center font-medium">来源</th>
              <th className="px-6 py-4 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-6 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
                >
                  正在加载交易明细...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-6 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
                >
                  暂无股票买入 / 卖出交易记录，请先导入 IBKR 数据。
                </td>
              </tr>
            ) : (
              transactions.map((trade) => (
                <tr
                  key={trade.id}
                  className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  onClick={() => onSelectTransaction(trade)}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-neutral-600 dark:text-neutral-300">
                    {trade.date}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {trade.symbol}
                      </span>
                      <span className="max-w-[260px] truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {trade.name ?? trade.description ?? '--'}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Tag color={trade.side === 'BUY' ? 'blue' : 'red'}>
                      {trade.side}
                    </Tag>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-medium tabular-nums text-neutral-900 dark:text-white">
                    {trade.quantity ?? '--'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">
                    {nullableCurrency(trade.price, trade.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-medium tabular-nums text-neutral-900 dark:text-white">
                    {signedCurrency(trade.amount, trade.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                    {formatCurrency(Math.abs(trade.commission), trade.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    {trade.realizedPnl === null ? (
                      <span className="text-neutral-400">--</span>
                    ) : (
                      <ProfitLossNumber amount={trade.realizedPnl} />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-neutral-500 dark:text-neutral-400">
                    {trade.currency}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <Tag color="gray">{trade.source}</Tag>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectTransaction(trade);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      查看
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        pagination={pagination}
        loading={loading}
        onPageChange={onPageChange}
      />
    </CardShell>
  );
}
