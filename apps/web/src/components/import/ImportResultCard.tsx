import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/common';
import type { ImportConfirmResponse } from '@/types';

interface ImportResultCardProps {
  result: ImportConfirmResponse;
  onImportAnother: () => void;
}

export function ImportResultCard({ result, onImportAnother }: ImportResultCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
        导入完成
      </h3>
      <p className="mb-8 max-w-md text-neutral-500 dark:text-neutral-400">
        ImportJob: {result.importJobId}
      </p>
      <div className="mb-8 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-5">
        <ResultTile label="Total" value={result.summary.totalRecords} />
        <ResultTile label="Inserted" value={result.summary.insertedRecords} tone="green" />
        <ResultTile label="Duplicate" value={result.summary.duplicateRecords} tone="neutral" />
        <ResultTile label="Updated" value={result.summary.updatedRecords} tone="yellow" />
        <ResultTile label="Failed" value={result.summary.failedRecords} tone="red" />
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onImportAnother}>
          继续导入
        </Button>
        <Button onClick={() => navigate('/transactions')}>查看交易明细</Button>
      </div>
    </div>
  );
}

function ResultTile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'green' | 'yellow' | 'red';
}) {
  const styles = {
    neutral: 'text-neutral-900 dark:text-white',
    green: 'text-green-700 dark:text-green-400',
    yellow: 'text-yellow-700 dark:text-yellow-400',
    red: 'text-red-700 dark:text-red-400',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/30">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${styles[tone]}`}>{value}</p>
    </div>
  );
}
