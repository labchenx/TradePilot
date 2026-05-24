import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  AlertTriangle,
  Database,
  History,
  Mail,
  Paperclip,
  PlayCircle,
  Search,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button, CardShell, PageTitle, Tag } from '@/components/common';
import {
  ImportInputPanel,
  ImportPreviewTable,
  ImportResultCard,
  ImportSteps,
} from '@/components/import';
import { importService, settingsService } from '@/services';
import type {
  ClearDataResponse,
  ConfirmEmailImportResponse,
  EmailSyncJobHistoryItem,
  EmailImportMailStatus,
  EmailImportPreviewResponse,
  EmailImportScanRange,
  EmailPdfTradePreview,
  EmailSettings,
  ImportConfirmResponse,
  ImportHistoryItem,
  ImportJobDetail,
  ImportPageStatus,
  ImportPreviewResponse,
  RunEmailSyncResponse,
} from '@/types';
import { notifyDataSyncStatusUpdated } from '@/utils/systemStatusEvents';

type ImportTab = 'csv' | 'email';

function getStep(status: ImportPageStatus) {
  if (status === 'previewReady') return 2;
  if (status === 'confirming') return 3;
  if (status === 'success') return 4;
  return 1;
}

function statusTone(status: ImportHistoryItem['status'] | EmailSyncJobHistoryItem['status']) {
  if (status === 'SUCCESS') return 'green';
  if (status === 'FAILED') return 'red';
  if (status === 'PARTIAL') return 'yellow';
  return 'blue';
}

function emailStatusTone(status: EmailImportMailStatus) {
  if (status === 'NEW') return 'green';
  if (status === 'DUPLICATE') return 'yellow';
  return 'red';
}

function scanRangeFromSettings(settings?: EmailSettings | null): EmailImportScanRange {
  if (settings?.defaultScanRange === 'SCAN_90D') return '90d';
  if (settings?.defaultScanRange === 'SCAN_30D') return '30d';
  if (settings?.defaultScanRange === 'SCAN_7D') return '7d';
  return '3d';
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '--';
}

function formatBytes(value: number) {
  if (!value) return '--';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

export function ImportPage() {
  const [activeTab, setActiveTab] = useState<ImportTab>('csv');
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
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(true);
  const [emailRange, setEmailRange] = useState<EmailImportScanRange>('3d');
  const [emailScanResult, setEmailScanResult] =
    useState<EmailImportPreviewResponse | null>(null);
  const [emailScanning, setEmailScanning] = useState(false);
  const [emailConfirming, setEmailConfirming] = useState(false);
  const [emailConfirmResult, setEmailConfirmResult] =
    useState<ConfirmEmailImportResponse | null>(null);
  const [emailSyncJobs, setEmailSyncJobs] = useState<EmailSyncJobHistoryItem[]>([]);
  const [emailRunNowResult, setEmailRunNowResult] =
    useState<RunEmailSyncResponse | null>(null);
  const [emailRunNowRunning, setEmailRunNowRunning] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const refreshHistory = async () => {
    try {
      setHistory(await importService.listHistory());
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    void refreshHistory();
    void loadEmailSettings();
    void refreshEmailSyncJobs();
  }, []);

  const refreshEmailSyncJobs = async () => {
    try {
      setEmailSyncJobs(await importService.listEmailSyncJobs());
    } catch {
      setEmailSyncJobs([]);
    }
  };

  const loadEmailSettings = async () => {
    setEmailSettingsLoading(true);
    try {
      const settings = await settingsService.getEmailSettings();
      setEmailSettings(settings);
      setEmailRange(scanRangeFromSettings(settings));
    } catch {
      setEmailSettings(null);
      setEmailRange('3d');
    } finally {
      setEmailSettingsLoading(false);
    }
  };

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
      notifyDataSyncStatusUpdated();
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

  const scanIbkrEmails = async () => {
    setEmailScanning(true);
    setEmailError(null);
    setEmailScanResult(null);
    setEmailConfirmResult(null);

    try {
      setEmailScanResult(await importService.scanAndPreviewIbkrMails(emailRange));
      await Promise.all([loadEmailSettings(), refreshEmailSyncJobs()]);
    } catch (scanError) {
      setEmailError(scanError instanceof Error ? scanError.message : String(scanError));
    } finally {
      setEmailScanning(false);
    }
  };

  const confirmEmailImport = async () => {
    if (!emailScanResult?.trades.some((trade) => trade.status === 'NEW')) return;

    setEmailConfirming(true);
    setEmailError(null);
    setEmailConfirmResult(null);

    try {
      const response = await importService.confirmEmailPdfImport(
        emailScanResult.trades,
      );
      setEmailConfirmResult(response);
      notifyDataSyncStatusUpdated();
      await Promise.all([refreshHistory(), loadEmailSettings(), refreshEmailSyncJobs()]);
      setEmailScanResult({
        ...emailScanResult,
        trades: emailScanResult.trades.map((trade) =>
          trade.status === 'NEW' ? { ...trade, status: 'DUPLICATE' } : trade,
        ),
      });
    } catch (confirmError) {
      setEmailError(
        confirmError instanceof Error ? confirmError.message : String(confirmError),
      );
    } finally {
      setEmailConfirming(false);
    }
  };

  const runEmailSyncNow = async () => {
    setEmailRunNowRunning(true);
    setEmailRunNowResult(null);
    setEmailError(null);

    try {
      const response = await importService.runEmailSyncNow();
      setEmailRunNowResult(response);
      notifyDataSyncStatusUpdated();
      await Promise.all([
        refreshHistory(),
        loadEmailSettings(),
        refreshEmailSyncJobs(),
      ]);
    } catch (runError) {
      setEmailError(runError instanceof Error ? runError.message : String(runError));
    } finally {
      setEmailRunNowRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTitle
        title={'\u6570\u636e\u5bfc\u5165 Data Import'}
        description="IBKR CSV import and Email PDF trade preview"
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'csv'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          <Upload className="h-4 w-4" />
          CSV Import
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'email'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          <Mail className="h-4 w-4" />
          Email Import / 邮件导入
        </button>
      </div>

      {activeTab === 'csv' ? <ImportSteps step={getStep(status)} /> : null}

      {activeTab === 'csv' && error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {activeTab === 'csv' ? (
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
      ) : (
        <EmailImportPanel
          settings={emailSettings}
          loading={emailSettingsLoading}
          range={emailRange}
          scanning={emailScanning}
          result={emailScanResult}
          confirmResult={emailConfirmResult}
          syncJobs={emailSyncJobs}
          runNowResult={emailRunNowResult}
          runNowRunning={emailRunNowRunning}
          error={emailError}
          onRangeChange={setEmailRange}
          onRefreshSettings={loadEmailSettings}
          onScan={scanIbkrEmails}
          onRunNow={runEmailSyncNow}
          onConfirm={confirmEmailImport}
          confirming={emailConfirming}
        />
      )}

      {activeTab === 'csv' && preview?.warnings.length ? (
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

function EmailImportPanel({
  settings,
  loading,
  range,
  scanning,
  confirming,
  result,
  confirmResult,
  syncJobs,
  runNowResult,
  runNowRunning,
  error,
  onRangeChange,
  onRefreshSettings,
  onScan,
  onRunNow,
  onConfirm,
}: {
  settings: EmailSettings | null;
  loading: boolean;
  range: EmailImportScanRange;
  scanning: boolean;
  confirming: boolean;
  result: EmailImportPreviewResponse | null;
  confirmResult: ConfirmEmailImportResponse | null;
  syncJobs: EmailSyncJobHistoryItem[];
  runNowResult: RunEmailSyncResponse | null;
  runNowRunning: boolean;
  error: string | null;
  onRangeChange: (range: EmailImportScanRange) => void;
  onRefreshSettings: () => void;
  onScan: () => void;
  onRunNow: () => void;
  onConfirm: () => void;
}) {
  const isReady =
    settings?.email &&
    settings.hasAuthSecret &&
    settings.status === 'CONNECTED';

  return (
    <div className="space-y-6">
      <CardShell className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
              <Mail className="h-5 w-5 text-blue-500" />
              Email Import / 邮件导入
            </h3>
            <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              扫描当前邮箱中的 IBKR 交易报告邮件，提取 PDF 文本并生成交易预览，不写入交易表。
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefreshSettings}>
            刷新邮箱配置
          </Button>
          <Button
            variant="outline"
            disabled={!isReady || runNowRunning}
            onClick={onRunNow}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {runNowRunning ? 'Syncing...' : 'Run Auto Sync Now'}
          </Button>
        </div>

        {loading ? (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
            正在读取邮箱配置...
          </div>
        ) : settings ? (
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <InfoTile label="邮箱服务商" value={settings.providerLabel} />
            <InfoTile label="邮箱地址" value={settings.email ?? '--'} />
            <InfoTile label="连接状态" value={settings.status} />
            <InfoTile label="最近同步" value={formatDateTime(settings.lastSyncAt)} />
          </div>
        ) : null}

        {!loading && !isReady ? (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-200">
            <p>请先到 Settings / Email 中配置邮箱并测试连接成功。</p>
            <Link
              className="mt-3 inline-flex items-center gap-2 font-medium text-yellow-900 underline underline-offset-4 dark:text-yellow-100"
              to="/settings"
            >
              <Settings className="h-4 w-4" />
              前往邮箱设置
            </Link>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              扫描范围
            </span>
            <select
              value={range}
              onChange={(event) =>
                onRangeChange(event.target.value as EmailImportScanRange)
              }
              className="h-10 min-w-40 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            >
              <option value="3d">最近 3 天</option>
              <option value="7d">最近 7 天</option>
              <option value="30d">最近 30 天</option>
              <option value="90d">最近 90 天</option>
            </select>
          </label>

          <Button disabled={!isReady || scanning} onClick={onScan}>
            <Search className="mr-2 h-4 w-4" />
            {scanning ? '解析中...' : '扫描并解析 IBKR 邮件'}
          </Button>
        </div>

        <p className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          本阶段只提取 PDF 文本并生成预览，不确认导入，不写入 trades / cash_flows，不标记已读、删除或移动邮件。
        </p>
      </CardShell>

      {runNowResult ? (
        <CardShell className="p-5">
          <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">
            Auto Sync Result
          </h3>
          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
            <InfoTile label="Status" value={runNowResult.status} />
            <InfoTile label="Scanned" value={runNowResult.scannedCount} />
            <InfoTile label="Matched" value={runNowResult.matchedCount} />
            <InfoTile label="Parsed" value={runNowResult.parsedTradeCount} />
            <InfoTile label="Inserted" value={runNowResult.insertedCount} />
            <InfoTile label="Duplicate" value={runNowResult.duplicateCount} />
            <InfoTile label="Error" value={runNowResult.errorCount} />
          </div>
        </CardShell>
      ) : null}

      <EmailSyncHistory jobs={syncJobs} />

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {scanning ? (
        <CardShell className="p-5 text-sm text-neutral-600 dark:text-neutral-300">
          正在通过 IMAP 只读扫描 INBOX，并解析 IBKR PDF 附件，请稍等...
        </CardShell>
      ) : null}

      {result ? (
        <EmailScanResult
          result={result}
          confirmResult={confirmResult}
          confirming={confirming}
          onConfirm={onConfirm}
        />
      ) : null}
    </div>
  );
}

function EmailSyncHistory({ jobs }: { jobs: EmailSyncJobHistoryItem[] }) {
  return (
    <CardShell className="overflow-hidden">
      <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
        <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
          <History className="h-5 w-5 text-blue-500" />
          Email Sync History
        </h3>
      </div>
      {jobs.length === 0 ? (
        <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No email sync jobs yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Trigger</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Scanned</th>
                <th className="px-5 py-3 text-right font-medium">Matched</th>
                <th className="px-5 py-3 text-right font-medium">PDF</th>
                <th className="px-5 py-3 text-right font-medium">Parsed</th>
                <th className="px-5 py-3 text-right font-medium">Inserted</th>
                <th className="px-5 py-3 text-right font-medium">Duplicate</th>
                <th className="px-5 py-3 text-right font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="whitespace-nowrap px-5 py-3">
                    {formatDateTime(job.startedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <Tag color={job.triggerType === 'SCHEDULED' ? 'blue' : 'gray'}>
                      {job.triggerType}
                    </Tag>
                  </td>
                  <td className="px-5 py-3">
                    <Tag color={statusTone(job.status)}>{job.status}</Tag>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {job.scannedCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {job.matchedCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {job.attachmentCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {job.parsedTradeCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {job.insertedCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {job.duplicateCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {job.errorCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  );
}

function EmailScanResult({
  result,
  confirmResult,
  confirming,
  onConfirm,
}: {
  result: EmailImportPreviewResponse;
  confirmResult: ConfirmEmailImportResponse | null;
  confirming: boolean;
  onConfirm: () => void;
}) {
  const newTradeCount = result.trades.filter((trade) => trade.status === 'NEW').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <InfoTile label="Scanned" value={result.scannedCount} />
        <InfoTile label="Matched" value={result.matchedCount} />
        <InfoTile label="PDF Attachments" value={result.attachmentCount} />
        <InfoTile label="Parsed Trades" value={result.parsedTradeCount} />
        <InfoTile label="Duplicate" value={result.duplicateCount} />
        <InfoTile label="Error" value={result.errorCount} />
      </div>

      <CardShell className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              确认导入
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              只会写入 NEW 交易，DUPLICATE 和 ERROR 会跳过并保留审计记录。
            </p>
          </div>
          <Button disabled={newTradeCount === 0 || confirming} onClick={onConfirm}>
            {confirming ? '确认中...' : `确认导入 ${newTradeCount} 条 NEW 交易`}
          </Button>
        </div>
        {confirmResult ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <InfoTile label="Import Job" value={confirmResult.importJobId} />
            <InfoTile label="Inserted" value={confirmResult.insertedCount} />
            <InfoTile label="Duplicate" value={confirmResult.duplicateCount} />
            <InfoTile label="Error" value={confirmResult.errorCount} />
          </div>
        ) : null}
      </CardShell>

      {result.warnings.length ? (
        <CardShell className="p-5">
          <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">
            扫描提示
          </h3>
          <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            {result.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </CardShell>
      ) : null}

      <CardShell className="overflow-hidden">
        <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
          <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
            <Mail className="h-5 w-5 text-blue-500" />
            IBKR 邮件扫描结果
          </h3>
        </div>
        {result.mails.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            未找到 IBKR 交易报告邮件
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">From</th>
                  <th className="px-5 py-3 font-medium">Received At</th>
                  <th className="px-5 py-3 font-medium">Attachment</th>
                  <th className="px-5 py-3 font-medium">Message ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {result.mails.map((mail) => (
                  <tr key={mail.messageId}>
                    <td className="px-5 py-4 align-top">
                      <Tag color={emailStatusTone(mail.status)}>{mail.status}</Tag>
                      {mail.errorMessage ? (
                        <p className="mt-2 max-w-xs text-xs text-red-600 dark:text-red-300">
                          {mail.errorMessage}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-sm px-5 py-4 align-top font-medium text-neutral-900 dark:text-white">
                      {mail.subject}
                    </td>
                    <td className="max-w-xs px-5 py-4 align-top text-neutral-600 dark:text-neutral-300">
                      {mail.from || '--'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 align-top text-neutral-600 dark:text-neutral-300">
                      {formatDateTime(mail.receivedAt)}
                    </td>
                    <td className="max-w-xs px-5 py-4 align-top text-neutral-600 dark:text-neutral-300">
                      {mail.attachments.map((attachment) => attachment.filename).join(', ') || '--'}
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 align-top text-xs text-neutral-500">
                      {mail.messageId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardShell>

      {result.diagnostics?.length ? (
        <EmailScanDiagnostics diagnostics={result.diagnostics} />
      ) : null}

      <EmailTradePreviewTable trades={result.trades} />

      {result.mails.some((mail) => mail.attachments.length > 0) ? (
        <CardShell className="overflow-hidden">
          <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
            <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
              <Paperclip className="h-5 w-5 text-blue-500" />
              PDF 附件列表
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Filename</th>
                  <th className="px-5 py-3 font-medium">Content Type</th>
                  <th className="px-5 py-3 text-right font-medium">Size</th>
                  <th className="px-5 py-3 font-medium">Attachment Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {result.mails.flatMap((mail) =>
                  mail.attachments.map((attachment) => (
                    <tr key={`${mail.messageId}-${attachment.attachmentHash}`}>
                      <td className="px-5 py-3 font-medium text-neutral-900 dark:text-white">
                        {attachment.filename}
                      </td>
                      <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300">
                        {attachment.contentType}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                        {formatBytes(attachment.size)}
                      </td>
                      <td className="max-w-md truncate px-5 py-3 text-xs text-neutral-500">
                        {attachment.attachmentHash}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </CardShell>
      ) : null}
    </div>
  );
}

function EmailScanDiagnostics({
  diagnostics,
}: {
  diagnostics: NonNullable<EmailImportPreviewResponse['diagnostics']>;
}) {
  return (
    <CardShell className="overflow-hidden">
      <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          扫描诊断
        </h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          仅展示邮件头部和附件元信息，不包含正文、PDF 内容或授权码。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
            <tr>
              <th className="px-5 py-3 font-medium">UID</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">From / Sender</th>
              <th className="px-5 py-3 font-medium">Subject Match</th>
              <th className="px-5 py-3 font-medium">From Match</th>
              <th className="px-5 py-3 text-right font-medium">PDF</th>
              <th className="px-5 py-3 font-medium">Attachments / Body Parts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {diagnostics.map((item) => (
              <tr key={item.uid}>
                <td className="px-5 py-3 text-xs text-neutral-500">{item.uid}</td>
                <td className="max-w-sm px-5 py-3 font-medium text-neutral-900 dark:text-white">
                  {item.subject}
                </td>
                <td className="max-w-xs px-5 py-3 text-neutral-600 dark:text-neutral-300">
                  {[item.from, item.sender, item.replyTo].filter(Boolean).join(' | ') ||
                    '--'}
                </td>
                <td className="px-5 py-3">
                  <Tag color={item.subjectMatches ? 'green' : 'gray'}>
                    {item.subjectMatches ? 'YES' : 'NO'}
                  </Tag>
                </td>
                <td className="px-5 py-3">
                  <Tag color={item.fromMatches ? 'green' : 'gray'}>
                    {item.fromMatches ? 'YES' : 'NO'}
                  </Tag>
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {item.pdfCandidateCount}
                </td>
                <td className="max-w-md px-5 py-3 text-xs text-neutral-500">
                  {item.attachmentNames.length
                    ? item.attachmentNames.join(', ')
                    : item.bodyParts
                        .map((part) =>
                          [part.part, part.type, part.disposition, part.filename]
                            .filter(Boolean)
                            .join(' / '),
                        )
                        .join('; ') || '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}

function EmailTradePreviewTable({ trades }: { trades: EmailPdfTradePreview[] }) {
  return (
    <CardShell className="overflow-hidden">
      <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          交易解析预览
        </h3>
      </div>
      {trades.length === 0 ? (
        <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          暂无可预览的 PDF 交易记录
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Symbol</th>
                <th className="px-5 py-3 font-medium">Side</th>
                <th className="px-5 py-3 text-right font-medium">Quantity</th>
                <th className="px-5 py-3 text-right font-medium">Price</th>
                <th className="px-5 py-3 text-right font-medium">Proceeds</th>
                <th className="px-5 py-3 text-right font-medium">Commission</th>
                <th className="px-5 py-3 text-right font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Trade Date/Time</th>
                <th className="px-5 py-3 font-medium">Settle Date</th>
                <th className="px-5 py-3 font-medium">Currency</th>
                <th className="px-5 py-3 font-medium">Source Hash</th>
                <th className="px-5 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {trades.map((trade) => (
                <tr key={trade.tempId}>
                  <td className="px-5 py-3">
                    <Tag color={emailStatusTone(trade.status)}>{trade.status}</Tag>
                  </td>
                  <td className="px-5 py-3 font-medium text-neutral-900 dark:text-white">
                    {trade.symbol || '--'}
                  </td>
                  <td className="px-5 py-3">
                    <Tag color={trade.side === 'SELL' ? 'yellow' : 'blue'}>
                      {trade.status === 'ERROR' ? '--' : trade.side}
                    </Tag>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatPreviewNumber(trade.quantity, trade.status)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatPreviewNumber(trade.price, trade.status)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatOptionalNumber(trade.proceeds)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatOptionalNumber(trade.commission)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatOptionalNumber(trade.fee)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {trade.tradeDateTime || '--'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {trade.settleDate ?? '--'}
                  </td>
                  <td className="px-5 py-3">{trade.currency || '--'}</td>
                  <td className="max-w-xs truncate px-5 py-3 text-xs text-neutral-500">
                    {trade.sourceHash}
                  </td>
                  <td className="max-w-sm px-5 py-3 text-xs text-red-600 dark:text-red-300">
                    {trade.errorMessage ?? '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  );
}

function formatPreviewNumber(value: number, status: EmailImportMailStatus) {
  if (status === 'ERROR') return '--';
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatOptionalNumber(value?: number) {
  if (typeof value !== 'number') return '--';
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-neutral-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
