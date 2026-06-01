import { ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react';
import { useCashFlows } from '@/hooks';
import { cn } from '@/utils';
import { MobileEmpty, MobileError, MobileLoading } from './MobileState';
import { dateText, money, signedMoney } from './mobileFormat';

export function MobileCashFlows() {
  const { data, items, loading, error } = useCashFlows();

  if (loading) return <MobileLoading label="加载现金流水..." />;
  if (error) return <MobileError message={error} />;
  if (!data) {
    return (
      <MobileEmpty
        title="暂无现金流水"
        description="导入或记录入金 / 出金后，这里会显示真实现金流水。"
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3">
        <SummaryStrip
          icon={ArrowDownToLine}
          label="总入金"
          value={money(data.summary.totalDeposits, data.summary.currency)}
          tone="green"
        />
        <SummaryStrip
          icon={ArrowUpFromLine}
          label="总出金"
          value={money(data.summary.totalWithdrawals, data.summary.currency)}
          tone="red"
        />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="grid gap-3">
          <div className="min-w-0 border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">净入金</p>
            <p className="break-words text-2xl font-bold leading-tight text-green-600 dark:text-green-400">
              {signedMoney(data.summary.netDeposit, data.summary.currency)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">现金余额</p>
            <p className="break-words text-xl font-semibold leading-tight text-neutral-900 dark:text-white">
              {money(data.summary.cashBalance, data.summary.currency)}
            </p>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <MobileEmpty
          title="暂无流水记录"
          description="当前筛选条件下没有入金或出金记录。"
        />
      ) : (
        <div className="space-y-3">
          {items.map((flow) => {
            const isDeposit = flow.type === 'Deposit';
            const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;

            return (
              <article
                key={flow.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <div
                    className={cn(
                      'mt-1 flex h-10 w-10 items-center justify-center rounded-xl',
                      isDeposit
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isDeposit
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400',
                      )}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className={cn(
                            'inline-flex rounded px-2 py-0.5 text-xs font-bold',
                            isDeposit
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                          )}
                        >
                          {isDeposit ? '入金' : '出金'}
                        </div>
                        <p className="mt-1 break-words text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                          {flow.source ?? 'IBKR'}
                        </p>
                      </div>

                      <div className="min-w-0 max-w-[45%] shrink-0 text-right">
                        <p
                          className={cn(
                            'break-words text-base font-bold leading-tight',
                            isDeposit
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400',
                          )}
                        >
                          {signedMoney(flow.amount, flow.currency)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {dateText(flow.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {flow.remark ? (
                  <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    <p className="break-words text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                      {flow.remark}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <Wallet className="h-4 w-4" />
          说明
        </div>
        现金流水当前只展示 Deposit / Withdrawal，和桌面端 Cash Flows 保持同一后端数据来源。
      </section>
    </div>
  );
}

function SummaryStrip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ArrowDownToLine;
  label: string;
  value: string;
  tone: 'green' | 'red';
}) {
  const toneClass =
    tone === 'green'
      ? 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
      : 'from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700';

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg', toneClass)}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <p className="text-xs opacity-90">{label}</p>
      </div>
      <p className="break-words text-2xl font-bold leading-tight">{value}</p>
    </div>
  );
}
