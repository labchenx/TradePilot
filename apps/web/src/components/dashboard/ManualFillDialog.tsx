import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/common';
import { dataGapService } from '@/services';
import { notifyDataSyncStatusUpdated } from '@/utils/systemStatusEvents';
import type { ManualFillTradePayload } from '@/types';

interface ManualFillDialogProps {
  date?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

export function ManualFillDialog({ date, onClose, onSuccess }: ManualFillDialogProps) {
  const [tradeDate, setTradeDate] = useState(date || todayString());
  const [tradeTime, setTradeTime] = useState('');
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [cashAdjustmentMode, setCashAdjustmentMode] =
    useState<'ADJUST_CASH' | 'POSITION_ONLY'>('ADJUST_CASH');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) {
      setError('请填写有效交易日期');
      return;
    }
    if (tradeTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(tradeTime)) {
      setError('成交时间格式应为 HH:mm 或 HH:mm:ss');
      return;
    }
    if (!symbol.trim()) {
      setError('请填写股票代码');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError('数量必须大于 0');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('价格必须大于 0');
      return;
    }
    if (!currency.trim()) {
      setError('请填写币种');
      return;
    }

    const payload: ManualFillTradePayload = {
      symbol: symbol.trim().toUpperCase(),
      tradeDate,
      tradeTime: tradeTime.trim() || undefined,
      side,
      quantity: Number(quantity),
      price: Number(price),
      commission: optionalNumber(commission),
      currency: currency.trim().toUpperCase(),
      accountId: accountId.trim() || undefined,
      note: note.trim() || undefined,
      cashAdjustmentMode,
    };

    setSubmitting(true);
    try {
      await dataGapService.manualFill(payload);
      setSuccess('补录成功，正在刷新组合数据');
      notifyDataSyncStatusUpdated();
      onSuccess?.();
      setTimeout(onClose, 900);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '补录失败');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">手动补录交易</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          补录会走导入审计、sourceHash 去重和组合重算。同日相似交易请填写不同成交时间或备注。
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="交易日期">
            <input
              type="date"
              value={tradeDate}
              disabled={Boolean(date)}
              onChange={(event) => setTradeDate(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="成交时间">
            <input
              type="time"
              step="1"
              value={tradeTime}
              onChange={(event) => setTradeTime(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="股票代码">
            <input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="AMD"
              className={inputClass}
            />
          </Field>
          <Field label="方向">
            <select
              value={side}
              onChange={(event) => setSide(event.target.value as 'BUY' | 'SELL')}
              className={inputClass}
            >
              <option value="BUY">BUY 买入</option>
              <option value="SELL">SELL 卖出</option>
            </select>
          </Field>
          <Field label="数量">
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="10"
              className={inputClass}
            />
          </Field>
          <Field label="价格">
            <input
              type="number"
              step="any"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="150.25"
              className={inputClass}
            />
          </Field>
          <Field label="手续费">
            <input
              type="number"
              step="any"
              min="0"
              value={commission}
              onChange={(event) => setCommission(event.target.value)}
              placeholder="正数，例如 1"
              className={inputClass}
            />
          </Field>
          <Field label="币种">
            <input
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="账户 ID">
            <input
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              placeholder="可选"
              className={inputClass}
            />
          </Field>
          <Field label="现金处理">
            <select
              value={cashAdjustmentMode}
              onChange={(event) =>
                setCashAdjustmentMode(event.target.value as 'ADJUST_CASH' | 'POSITION_ONLY')
              }
              className={inputClass}
            >
              <option value="ADJUST_CASH">同步影响现金/融资</option>
              <option value="POSITION_ONLY">仅补持仓，现金已反映</option>
            </select>
          </Field>
        </div>

        <div className="mt-3">
          <Field label="备注">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="可选，用于区分同日相似交易"
              className={inputClass}
            />
          </Field>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
            {success}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '确认补录'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      {children}
    </label>
  );
}
