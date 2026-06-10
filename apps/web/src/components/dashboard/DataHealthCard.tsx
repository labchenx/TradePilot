import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarPlus, ShieldCheck } from 'lucide-react';
import { Button, CardShell, Tag } from '@/components/common';
import { dataGapService } from '@/services';
import type { DataGapCheckResponse, DataGapItem } from '@/types';
import { ManualFillDialog } from './ManualFillDialog';

export function DataHealthCard() {
  const [data, setData] = useState<DataGapCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fillDate, setFillDate] = useState<string | undefined>();
  const [showManualFill, setShowManualFill] = useState(false);

  const fetchGaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await dataGapService.checkGaps(30));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '数据健康检查失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGaps();
  }, [fetchGaps]);

  const openManualFill = (date?: string) => {
    setFillDate(date);
    setShowManualFill(true);
  };
  const closeManualFill = () => {
    setShowManualFill(false);
    setFillDate(undefined);
  };
  const hasGaps = (data?.gaps.length ?? 0) > 0;
  const noTradeData = data?.status === 'NO_TRADE_DATA';
  const iconClass = hasGaps
    ? 'rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    : noTradeData
      ? 'rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
      : 'rounded-lg bg-green-100 p-2 text-green-700 dark:bg-green-900/30 dark:text-green-300';

  return (
    <>
      <CardShell className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={iconClass}>
              {hasGaps ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">数据健康</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {loading
                  ? '正在检查近 30 天交易数据'
                  : noTradeData
                    ? '暂无足够交易数据用于判断缺口'
                  : data
                    ? `检查范围：${data.checkedRange.start} ~ ${data.checkedRange.end}`
                    : '检查交易数据缺口'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasGaps ? <Tag color="yellow">{data?.gaps.length} 个疑似缺口</Tag> : null}
            {noTradeData ? <Tag color="gray">暂无交易基线</Tag> : null}
            <Button variant="outline" size="sm" onClick={() => openManualFill()}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              手动补录
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchGaps}>
              重试
            </Button>
          </div>
        ) : null}

        {!loading && !error && noTradeData ? (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            当前还没有交易事件，暂不进行缺口判断。导入或补录第一笔交易后，再根据前后交易日检测可能缺失的数据。
          </p>
        ) : null}

        {!loading && !error && !noTradeData && !hasGaps ? (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            暂未发现前后有数据但中间完全缺失的交易日。
          </p>
        ) : null}

        {hasGaps ? (
          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
            {data?.gaps.map((gap) => (
              <GapRow key={gap.date} gap={gap} onFill={() => openManualFill(gap.date)} />
            ))}
          </div>
        ) : null}
      </CardShell>

      {showManualFill ? (
        <ManualFillDialog
          date={fillDate}
          onClose={closeManualFill}
          onSuccess={() => void fetchGaps()}
        />
      ) : null}
    </>
  );
}

function GapRow({ gap, onFill }: { gap: DataGapItem; onFill: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40">
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-white">{gap.date}</p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {gap.reasons.join(' / ')}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onFill}>
        补录
      </Button>
    </div>
  );
}
