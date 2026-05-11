import { AlertCircle, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { Button, Tag } from '@/components/common';
import type { ImportPreviewRecord } from '@/types';
import { formatCurrency } from '@/utils';

interface ImportPreviewTableProps {
  records: ImportPreviewRecord[];
  step: number;
  onBack: () => void;
  onProceed: () => void;
  onConfirm: () => void;
}

export function ImportPreviewTable({ records, step, onBack, onProceed, onConfirm }: ImportPreviewTableProps) {
  const validCount = records.filter((record) => record.status === 'SUCCESS').length;
  const warningCount = records.filter((record) => record.status === 'WARNING').length;
  const errorCount = records.filter((record) => record.status === 'ERROR').length;

  return (
    <div className="flex flex-col">
      <div className="border-b border-neutral-200 bg-neutral-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
          <FileText className="h-5 w-5 text-blue-500" />
          Parsed Trade Preview
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Please review the parsed trades before importing. Found {records.length} records.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Trade Date</th>
              <th className="px-6 py-4 font-medium">Symbol</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 text-right font-medium">Quantity</th>
              <th className="px-6 py-4 text-right font-medium">Price</th>
              <th className="px-6 py-4 text-right font-medium">Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="whitespace-nowrap px-6 py-4">
                  {record.status === 'SUCCESS' ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-500">
                      <CheckCircle2 className="h-4 w-4" /> Ready
                    </div>
                  ) : null}
                  {record.status === 'WARNING' ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-500" title={record.message}>
                      <AlertTriangle className="h-4 w-4" /> Warning
                    </div>
                  ) : null}
                  {record.status === 'ERROR' ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-500" title={record.message}>
                      <AlertCircle className="h-4 w-4" /> Error
                    </div>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-neutral-600 dark:text-neutral-300">{record.tradeDate}</td>
                <td className="whitespace-nowrap px-6 py-4 font-bold text-neutral-900 dark:text-white">{record.symbol}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Tag color={record.side === 'BUY' ? 'green' : 'red'}>{record.side}</Tag>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-medium tabular-nums text-neutral-900 dark:text-white">{record.quantity}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">{formatCurrency(record.price)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-neutral-900 dark:text-white">{formatCurrency(record.fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> {validCount} Valid
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500" /> {warningCount} Warning
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-red-500" /> {errorCount} Error
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>
            Cancel
          </Button>
          {step === 2 ? (
            <Button onClick={onProceed}>Proceed</Button>
          ) : (
            <Button onClick={onConfirm} className="border-0 bg-blue-600 text-white hover:bg-blue-700">
              Confirm Import
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
