import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Mail, PlayCircle, Upload } from 'lucide-react';
import { importService, settingsService } from '@/services';
import type { EmailSettings, EmailSyncJobHistoryItem, RunEmailSyncResponse } from '@/types';
import { cn } from '@/utils';
import { MobileError, MobileLoading } from './MobileState';
import { dateTimeText, statusClass } from './mobileFormat';

function syncTone(status: EmailSyncJobHistoryItem['status']) {
  if (status === 'SUCCESS') return 'green';
  if (status === 'FAILED') return 'red';
  if (status === 'PARTIAL') return 'yellow';
  return 'blue';
}

export function MobileImport() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [jobs, setJobs] = useState<EmailSyncJobHistoryItem[]>([]);
  const [runResult, setRunResult] = useState<RunEmailSyncResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [settings, history] = await Promise.all([
        settingsService.getEmailSettings(),
        importService.listEmailSyncJobs(),
      ]);
      setEmailSettings(settings);
      setJobs(history);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setError(null);
    setRunResult(null);
    try {
      const result = await importService.runEmailSyncNow();
      setRunResult(result);
      const [settings, history] = await Promise.all([
        settingsService.getEmailSettings(),
        importService.listEmailSyncJobs(),
      ]);
      setEmailSettings(settings);
      setJobs(history);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (loading) return <MobileLoading label="加载导入状态..." />;

  const connected = emailSettings?.status === 'CONNECTED';
  const latestJob = jobs[0];

  return (
    <div className="space-y-4">
      {error ? <MobileError message={error} /> : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            CSV 导入
          </h3>
        </div>
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          移动端第一版保留状态入口。CSV 文件预览、确认导入和历史明细请在桌面端
          Imports 页面完成，避免手机文件选择和宽表格影响确认体验。
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Email Sync
              </h3>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {emailSettings?.email ?? '尚未配置邮箱'}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-semibold',
              connected ? statusClass('green') : statusClass('gray'),
            )}
          >
            {connected ? 'CONNECTED' : emailSettings?.status ?? 'DISCONNECTED'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Info label="自动同步" value={emailSettings?.autoSyncEnabled ? 'Enabled' : 'Disabled'} />
          <Info label="同步时间" value={emailSettings?.syncTime ?? '07:00'} />
          <Info label="最近同步" value={dateTimeText(emailSettings?.lastSyncAt)} />
          <Info label="最近状态" value={emailSettings?.lastSyncStatus ?? '--'} />
        </div>

        {emailSettings?.lastSyncErrorMessage ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs leading-5 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {emailSettings.lastSyncErrorMessage}
          </div>
        ) : null}

        <button
          type="button"
          disabled={!connected || running}
          onClick={runNow}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:bg-neutral-300 disabled:text-neutral-500 dark:bg-blue-500 dark:disabled:bg-neutral-700"
        >
          <PlayCircle className="h-4 w-4" />
          {running ? '同步中...' : '手动同步一次'}
        </button>

        {!connected ? (
          <p className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            请先在 Settings 中配置并测试邮箱连接。移动端不会展示或保存授权码。
          </p>
        ) : null}
      </section>

      {runResult ? (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-200">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            同步任务已执行
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Info label="解析" value={runResult.parsedTradeCount} />
            <Info label="新增" value={runResult.insertedCount} />
            <Info label="重复" value={runResult.duplicateCount} />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
          <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
            <Clock className="h-5 w-5 text-blue-500" />
            最近同步任务
          </h3>
        </div>
        {jobs.length === 0 ? (
          <p className="p-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
            暂无 Email Sync 任务记录。
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {jobs.slice(0, 8).map((job) => (
              <article key={job.id} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {job.triggerType}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {dateTimeText(job.startedAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs font-semibold',
                      statusClass(syncTone(job.status)),
                    )}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <Info label="邮件" value={job.scannedCount} />
                  <Info label="匹配" value={job.matchedCount} />
                  <Info label="PDF" value={job.attachmentCount} />
                  <Info label="新增" value={job.insertedCount} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-neutral-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
