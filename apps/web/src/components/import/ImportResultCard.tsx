import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/common';
import type { ImportResult } from '@/types';

interface ImportResultCardProps {
  result: ImportResult;
  onImportAnother: () => void;
}

export function ImportResultCard({ result, onImportAnother }: ImportResultCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Import Successful!</h3>
      <p className="mb-8 max-w-md text-neutral-500 dark:text-neutral-400">
        The trade records have been parsed with the static mock flow. Errors are skipped in this preview UI.
      </p>
      <div className="mb-8 grid w-full max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
        <ResultTile label="Total Records" value={result.totalRecords} />
        <ResultTile label="Successfully Imported" value={result.successCount} tone="green" />
        <ResultTile label="Duplicates Skipped" value={result.duplicateCount} tone="yellow" />
        <ResultTile label="Failed Records" value={result.failedCount} tone="red" />
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={onImportAnother}>
          Import Another
        </Button>
        <Button onClick={() => navigate('/transactions')}>View Trades 交易记录</Button>
      </div>
    </div>
  );
}

function ResultTile({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'green' | 'yellow' | 'red' }) {
  const styles = {
    neutral: 'border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-white',
    green: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-400',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-900/10 dark:text-yellow-400',
    red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400',
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[tone]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

