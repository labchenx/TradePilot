import { useEffect, useState } from 'react';
import { AlertTriangle, Database, History, Trash2 } from 'lucide-react';
import { Button, CardShell, PageTitle, Tag } from '@/components/common';
import {
  ImportInputPanel,
  ImportPreviewTable,
  ImportResultCard,
  ImportSteps,
} from '@/components/import';
import { importService } from '@/services';
import type {
  ClearDataResponse,
  ImportConfirmResponse,
  ImportHistoryItem,
  ImportJobDetail,
  ImportPageStatus,
  ImportPreviewResponse,
} from '@/types';

function getStep(status: ImportPageStatus) {
  if (status === 'previewReady') return 2;
  if (status === 'confirming') return 3;
  if (status === 'success') return 4;
  return 1;
}

function statusTone(status: ImportHistoryItem['status']) {
  if (status === 'SUCCESS') return 'green';
  if (status === 'FAILED') return 'red';
  if (status === 'PARTIAL') return 'yellow';
  return 'blue';
}

export function ImportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ImportPageStatus>('idle');
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportConfirmResponse | null>(null);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [detail, setDetail] = useState<ImportJobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearText, setClearText] = useState('');
  const [clearResult, setClearResult] = useState<ClearDataResponse | null>(null);
  const [clearing, setClearing] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);

  const refreshHistory = async () => {
    try {
      setHistory(await importService.listHistory());
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    void refreshHistory();
  }, []);

  const parsePreview = async () => {
    setStatus('parsing');
    setError(null);
    setResult(null);
    setClearResult(null);

    try {
      const response = await importService.previewIbkrCsv(files);
      setPreview(response);
      setStatus('previewReady');
      await refreshHistory();
    } catch (previewError) {
      setStatus('error');
      setError(previewError instanceof Error ? previewError.message : String(previewError));
    }
  };

  const confirmImport = async () => {
    if (!preview?.jobPreviewId) return;

    setStatus('confirming');
    setError(null);

    try {
      const response = await importService.confirmIbkrCsv(
        preview.jobPreviewId,
        preview.records,
      );
      setResult(response);
      setStatus('success');
      await refreshHistory();
    } catch (confirmError) {
      setStatus('previewReady');
      setError(confirmError instanceof Error ? confirmError.message : String(confirmError));
      await refreshHistory();
    }
  };

  const importAnother = () => {
    setFiles([]);
    setPreview(null);
    setResult(null);
    setDetail(null);
    setError(null);
    setStatus('idle');
  };

  const clearData = async () => {
    setClearing(true);
    setError(null);
    setClearResult(null);

    try {
      const response = await importService.clearData(clearText);
      setClearResult(response);
      setClearText('');
      setFiles([]);
      setPreview(null);
      setResult(null);
      setDetail(null);
      setStatus('idle');
      await refreshHistory();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : String(clearError));
    } finally {
      setClearing(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      setDetail(await importService.getDetail(id));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : String(detailError));
    }
  };

  const deleteHistory = async (id: string) => {
    const confirmed = window.confirm(
      '\u53ea\u5220\u9664\u8fd9\u6761\u5bfc\u5165\u5386\u53f2\u548c\u5ba1\u8ba1\u660e\u7ec6\uff0c\u4e0d\u4f1a\u5220\u9664\u5df2\u5bfc\u5165\u7684\u4ea4\u6613\u3001\u73b0\u91d1\u6d41\u6c34\u6216\u6301\u4ed3\u6570\u636e\u3002\u786e\u8ba4\u5220\u9664\u5417\uff1f',
    );

    if (!confirmed) return;

    setDeletingHistoryId(id);
    setError(null);

    try {
      await importService.deleteHistory(id);
      if (detail?.id === id) {
        setDetail(null);
      }
      await refreshHistory();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : String(deleteError));
    } finally {
      setDeletingHistoryId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTitle
        title={'\u6570\u636e\u5bfc\u5165 Data Import'}
        description="IBKR CSV preview, deduplication, confirmation, and import history"
      />

      <ImportSteps step={getStep(status)} />

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <CardShell className="overflow-hidden">
        {status === 'success' && result ? (
          <ImportResultCard result={result} onImportAnother={importAnother} />
        ) : preview && status !== 'idle' && status !== 'parsing' ? (
          <ImportPreviewTable
            files={preview.files}
            records={preview.records}
            summary={preview.summary}
            confirming={status === 'confirming'}
            errorMessage={error}
            onBack={importAnother}
            onConfirm={confirmImport}
          />
        ) : (
          <ImportInputPanel
            files={files}
            disabled={status === 'parsing'}
            onFilesChange={setFiles}
            onParse={parsePreview}
          />
        )}
      </CardShell>

      {preview?.warnings.length ? (
        <CardShell className="p-5">
          <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">
            {'\u89e3\u6790\u8b66\u544a'}
          </h3>
          <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            {preview.warnings.slice(0, 8).map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
            {preview.warnings.length > 8 ? (
              <p>
                {'\u8fd8\u6709 '}
                {preview.warnings.length - 8}
                {' \u6761\u8b66\u544a\u672a\u5c55\u793a'}
              </p>
            ) : null}
          </div>
        </CardShell>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <CardShell className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-200 p-5 dark:border-neutral-800">
            <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
              <History className="h-5 w-5 text-blue-500" />
              {'\u5bfc\u5165\u5386\u53f2'}
            </h3>
            <Button variant="outline" size="sm" onClick={refreshHistory}>
              {'\u5237\u65b0'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">{'\u65f6\u95f4'}</th>
                  <th className="px-5 py-3 font-medium">{'\u6587\u4ef6'}</th>
                  <th className="px-5 py-3 font-medium">{'\u72b6\u6001'}</th>
                  <th className="px-5 py-3 text-right font-medium">{'\u65b0\u589e'}</th>
                  <th className="px-5 py-3 text-right font-medium">{'\u91cd\u590d'}</th>
                  <th className="px-5 py-3 text-right font-medium">{'\u66f4\u65b0'}</th>
                  <th className="px-5 py-3 text-right font-medium">{'\u5931\u8d25'}</th>
                  <th className="px-5 py-3 text-right font-medium">{'\u64cd\u4f5c'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-neutral-500">
                      {'\u6682\u65e0\u5bfc\u5165\u5386\u53f2'}
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      onClick={() => openDetail(item.id)}
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-neutral-600 dark:text-neutral-300">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="max-w-xs truncate px-5 py-3 font-medium text-neutral-900 dark:text-white">
                        {Array.isArray(item.fileNames)
                          ? item.fileNames.join(', ')
                          : '--'}
                      </td>
                      <td className="px-5 py-3">
                        <Tag color={statusTone(item.status)}>{item.status}</Tag>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {item.successCount}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {item.duplicateCount}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {item.updateCount}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {item.failedCount}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          title={'\u5220\u9664\u5bfc\u5165\u5386\u53f2'}
                          disabled={deletingHistoryId === item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteHistory(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardShell>

        <CardShell className="p-5">
          <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
            <Database className="h-5 w-5 text-red-500" />
            {'\u6e05\u7a7a\u6211\u7684\u6570\u636e'}
          </h3>
          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {'\u4f1a\u6e05\u7a7a\u4ea4\u6613\u4e8b\u4ef6\u3001\u73b0\u91d1\u6d41\u6c34\u3001\u6301\u4ed3\u5feb\u7167\u3001\u7ec4\u5408\u5feb\u7167\u548c\u5bfc\u5165\u65e5\u5fd7\uff1b\u4e0d\u4f1a\u6e05\u7a7a\u516c\u5171\u884c\u60c5\u7f13\u5b58\u3002'}
          </p>
          <input
            value={clearText}
            onChange={(event) => setClearText(event.target.value)}
            placeholder={'\u8f93\u5165 CLEAR'}
            className="mt-4 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          />
          <Button
            variant="danger"
            className="mt-3 w-full"
            disabled={clearText !== 'CLEAR' || clearing}
            onClick={clearData}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {clearing ? '\u6e05\u7a7a\u4e2d...' : '\u786e\u8ba4\u6e05\u7a7a'}
          </Button>
          {clearResult ? (
            <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 dark:bg-neutral-950/50 dark:text-neutral-300">
              {'\u5df2\u6e05\u7a7a '}
              {Object.values(clearResult.deletedCounts).reduce((sum, value) => sum + value, 0)}
              {' \u6761\u6570\u636e'}
            </div>
          ) : null}
        </CardShell>
      </div>

      {detail ? (
        <CardShell className="overflow-hidden">
          <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {'\u5bfc\u5165\u8be6\u60c5 '}
              {detail.id}
            </h3>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Symbol</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {detail.records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-3">{record.recordType}</td>
                    <td className="px-5 py-3">{record.status}</td>
                    <td className="px-5 py-3">
                      {record.normalizedData?.symbol ?? '--'}
                    </td>
                    <td className="px-5 py-3">
                      {record.normalizedData?.tradeDate ?? '--'}
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {record.errorMessage ?? '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardShell>
      ) : null}
    </div>
  );
}
