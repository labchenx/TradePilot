import { Clock } from 'lucide-react';
import { Button, CardShell } from '@/components/common';
import type { SyncStatus } from '@/types';

interface SyncStatusCardProps {
  status: SyncStatus;
}

export function SyncStatusCard({ status }: SyncStatusCardProps) {
  return (
    <CardShell className="p-5">
      <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Sync Status 数据同步</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{status.title}</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{status.timestamp}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Imported Records</p>
            <p className="mt-1 text-lg font-bold text-neutral-900 dark:text-white">{status.importedRecords}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Duplicates Skipped</p>
            <p className="mt-1 text-lg font-bold text-yellow-600 dark:text-yellow-500">{status.duplicatesSkipped}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Failed Records</p>
            <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-500">{status.failedRecords}</p>
          </div>
        </div>
        <Button variant="secondary" className="mt-4 w-full">
          Import Now 立即导入
        </Button>
      </div>
    </CardShell>
  );
}

