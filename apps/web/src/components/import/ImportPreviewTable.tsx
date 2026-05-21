import { AlertCircle, CheckCircle2, FileText, RefreshCw } from 'lucide-react';
import { Button, Tag } from '@/components/common';
import type {
  ImportPreviewFile,
  ImportPreviewRecord,
  ImportPreviewStatus,
  ImportPreviewSummary,
  ImportRecordType,
} from '@/types';
import { formatCurrency } from '@/utils';

interface ImportPreviewTableProps {
  files: ImportPreviewFile[];
  records: ImportPreviewRecord[];
  summary: ImportPreviewSummary;
  confirming?: boolean;
  errorMessage?: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

const statusColor: Record<ImportPreviewStatus, 'green' | 'gray' | 'yellow' | 'red'> = {
  NEW: 'green',
  DUPLICATE: 'gray',
  UPDATE: 'yellow',
  ERROR: 'red',
};

const typeColor: Record<ImportRecordType, 'blue' | 'indigo' | 'yellow' | 'gray'> = {
  TRADE: 'blue',
  CASH_FLOW: 'indigo',
  CORPORATE_ACTION: 'yellow',
  UNRECOGNIZED: 'gray',
};

function displayAmount(record: ImportPreviewRecord) {
  const amount = record.data.amount ?? record.data.netAmount ?? record.data.grossAmount;
  if (typeof amount !== 'number') return '--';

  return formatCurrency(amount, record.data.currency ?? 'USD');
}

function displayNumber(value: number | undefined) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : '--';
}

export function ImportPreviewTable({
  files,
  records,
  summary,
  confirming = false,
  errorMessage,
  onBack,
  onConfirm,
}: ImportPreviewTableProps) {
  const canConfirm = summary.newRecords + summary.updateRecords > 0;

  return (
    <div className="flex flex-col">
      <div className="border-b border-neutral-200 bg-neutral-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
          <FileText className="h-5 w-5 text-blue-500" />
          解析预览
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {summary.totalRecords} 条记录，{summary.newRecords} 条新增，{summary.duplicateRecords} 条重复，{summary.updateRecords} 条可更新，{summary.errorRecords} 条错误
        </p>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-4">
        <SummaryTile label="TRADE" value={summary.tradeRecords} />
        <SummaryTile label="CASH_FLOW" value={summary.cashFlowRecords} />
        <SummaryTile label="CORPORATE_ACTION" value={summary.corporateActionRecords} />
        <SummaryTile label="UNRECOGNIZED" value={summary.unrecognizedRecords} />
      </div>

      <div className="border-y border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-5 py-3 font-medium">文件</th>
              <th className="px-5 py-3 font-medium">状态</th>
              <th className="px-5 py-3 text-right font-medium">行数</th>
              <th className="px-5 py-3 text-right font-medium">记录</th>
              <th className="px-5 py-3 font-medium">错误</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {files.map((file) => (
              <tr key={file.fileHash}>
                <td className="px-5 py-3 font-medium text-neutral-900 dark:text-white">
                  {file.fileName}
                </td>
                <td className="px-5 py-3">
                  <Tag color={file.status === 'PARSED' ? 'green' : 'red'}>
                    {file.status}
                  </Tag>
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                  {file.totalRows}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                  {file.parsedRows}
                </td>
                <td className="max-w-sm px-5 py-3 text-neutral-500 dark:text-neutral-400">
                  {file.errorMessage ?? '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Side</th>
              <th className="px-5 py-3 text-right font-medium">Quantity</th>
              <th className="px-5 py-3 text-right font-medium">Price</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
              <th className="px-5 py-3 text-right font-medium">Commission</th>
              <th className="px-5 py-3 font-medium">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {records.map((record) => (
              <tr
                key={record.tempId}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td className="whitespace-nowrap px-5 py-3">
                  <Tag color={statusColor[record.status]}>{record.status}</Tag>
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <Tag color={typeColor[record.recordType]}>
                    {record.recordType}
                  </Tag>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-neutral-600 dark:text-neutral-300">
                  {record.data.tradeDate || '--'}
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-semibold text-neutral-900 dark:text-white">
                  {record.data.symbol || '--'}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  {record.data.side ? (
                    <Tag color={record.data.side === 'BUY' ? 'green' : 'red'}>
                      {record.data.side}
                    </Tag>
                  ) : (
                    '--'
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                  {displayNumber(record.data.quantity)}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                  {typeof record.data.price === 'number'
                    ? formatCurrency(record.data.price, record.data.currency ?? 'USD')
                    : '--'}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                  {displayAmount(record)}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-neutral-900 dark:text-white">
                  {typeof record.data.commission === 'number'
                    ? formatCurrency(record.data.commission, record.data.currency ?? 'USD')
                    : '--'}
                </td>
                <td className="max-w-xs px-5 py-3 text-neutral-500 dark:text-neutral-400">
                  {record.errorMessage ?? '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errorMessage ? (
        <div className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-neutral-200 bg-neutral-50/50 p-5 md:flex-row md:items-center md:justify-between dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> NEW {summary.newRecords}
          </span>
          <span className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4 text-yellow-500" /> UPDATE {summary.updateRecords}
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-red-500" /> ERROR {summary.errorRecords}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" disabled={confirming} onClick={onBack}>
            返回
          </Button>
          <Button disabled={!canConfirm || confirming} onClick={onConfirm}>
            {confirming ? '导入中...' : '确认导入'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/30">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
