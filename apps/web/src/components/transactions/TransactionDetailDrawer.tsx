import { Repeat2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button, ProfitLossNumber, Tag } from '@/components/common';
import type { PortfolioTransactionApiDto, TradeSide } from '@/types';
import { formatCurrency } from '@/utils';

interface TransactionDetailDrawerProps {
  transaction: PortfolioTransactionApiDto | null;
  onClose: () => void;
  onCorrectSide?: (
    id: string,
    side: TradeSide,
  ) => Promise<PortfolioTransactionApiDto>;
}

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function nullableCurrency(
  value: number | null | undefined,
  currency = 'USD',
) {
  return value === null || value === undefined ? '--' : formatCurrency(value, currency);
}

export function TransactionDetailDrawer({
  transaction,
  onClose,
  onCorrectSide,
}: TransactionDetailDrawerProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) {
    return null;
  }

  const correctedSide: TradeSide = transaction.side === 'BUY' ? 'SELL' : 'BUY';
  const handleCorrectSide = async () => {
    if (!onCorrectSide) return;
    setSaving(true);
    setError(null);

    try {
      await onCorrectSide(transaction.id, correctedSide);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update transaction side.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button
        type="button"
        aria-label="关闭交易详情"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl dark:bg-neutral-950">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-200 bg-white px-6 py-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              交易详情
            </p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900 dark:text-white">
              {transaction.symbol}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 p-6">
          <section className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 sm:grid-cols-2">
            <Field label="日期" value={transaction.date} />
            <Field
              label="方向"
              value={
                <Tag color={transaction.side === 'BUY' ? 'blue' : 'red'}>
                  {transaction.side}
                </Tag>
              }
            />
            <Field label="名称" value={transaction.name ?? transaction.description ?? '--'} />
            <Field label="币种" value={transaction.currency} />
            <Field label="数量" value={transaction.quantity ?? '--'} />
            <Field
              label="成交价"
              value={nullableCurrency(transaction.price, transaction.currency)}
            />
            <Field
              label="成交金额"
              value={formatCurrency(transaction.amount, transaction.currency)}
            />
            <Field
              label="佣金"
              value={formatCurrency(Math.abs(transaction.commission), transaction.currency)}
            />
            <Field
              label="已实现盈亏"
              value={
                transaction.realizedPnl === null ? (
                  '--'
                ) : (
                  <ProfitLossNumber amount={transaction.realizedPnl} />
                )
              }
            />
            <Field label="来源" value={transaction.source} />
          </section>

          <section className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                交易方向纠错
              </p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                当前为 {transaction.side}，可修正为 {correctedSide}
              </p>
              {error ? (
                <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
                  {error}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant={correctedSide === 'SELL' ? 'danger' : 'outline'}
              size="sm"
              className="h-9 shrink-0"
              onClick={() => void handleCorrectSide()}
              disabled={saving || !onCorrectSide}
            >
              <Repeat2 className="mr-2 h-4 w-4" />
              {saving ? '修正中...' : `修正为 ${correctedSide}`}
            </Button>
          </section>

          <section className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 sm:grid-cols-2">
            <Field label="导入批次" value={transaction.importBatchId} />
            <Field label="来源文件" value={transaction.sourceFileName} />
            <Field label="来源分区" value={transaction.sourceSection} />
            <Field label="原始行号" value={transaction.rawRowIndex} />
            <Field label="账户" value={transaction.accountId || '--'} />
            <Field label="IBKR type" value={transaction.ibkrType || '--'} />
          </section>

          <section className="rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                rawRecord 原始记录
              </h3>
            </div>
            <pre className="max-h-[360px] overflow-auto p-4 text-xs leading-5 text-neutral-700 dark:text-neutral-300">
              {JSON.stringify(transaction.rawRecord, null, 2)}
            </pre>
          </section>
        </div>
      </aside>
    </div>
  );
}
