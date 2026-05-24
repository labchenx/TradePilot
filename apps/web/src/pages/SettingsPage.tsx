import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  KeyRound,
  Link2Off,
  Mail,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '@/app/auth-provider';
import { Button, CardShell, Input, PageTitle } from '@/components/common';
import { useSettings, useSystemStatus } from '@/hooks';
import {
  marketDataService,
  portfolioMaintenanceService,
} from '@/services';
import type { EmailSettings, ImportSettings } from '@/types';

type SyncActionKey = 'recalculate' | 'refreshQuotes' | 'regenerateTrend';

interface SyncActionState {
  running: boolean;
  success: string | null;
  error: string | null;
  lastRunAt: string | null;
}

const initialSyncState: SyncActionState = {
  running: false,
  success: null,
  error: null,
  lastRunAt: null,
};

const navigationItems = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'data-sync', label: 'Data & Sync', icon: Database },
  { id: 'import', label: 'Import', icon: FileText },
  { id: 'danger-zone', label: 'Danger Zone', icon: Shield },
] as const;

type SettingsSectionId = (typeof navigationItems)[number]['id'];

const sectionDomIds: Record<SettingsSectionId, string> = {
  account: 'settings-account',
  email: 'settings-email',
  'data-sync': 'settings-data-sync',
  import: 'settings-import',
  'danger-zone': 'settings-danger-zone',
};

function formatDateTime(value?: string | null) {
  if (!value) return '--';
  return new Date(value).toLocaleString();
}

function toDuplicateStrategy(value: string): ImportSettings['duplicateStrategy'] {
  return value === 'SKIP' ? 'SKIP' : 'UPDATE_EMPTY_FIELDS';
}

function isAutoRefreshEnabled(settings: ImportSettings) {
  return (
    settings.autoRefreshQuotesAfterImport &&
    settings.autoRegenerateSnapshotsAfterImport &&
    settings.autoRecalculateMetricsAfterImport
  );
}

function createEmailForm(settings: EmailSettings) {
  return {
    provider: settings.provider,
    email: settings.email ?? '',
    defaultScanRange: settings.defaultScanRange,
    onlyIbkrEmails: settings.onlyIbkrEmails,
    onlyPdfAttachments: settings.onlyPdfAttachments,
    markAsRead: settings.markAsRead,
  };
}

function getEmailProviderHint(provider: EmailSettings['provider']) {
  return provider === 'NETEASE_163'
    ? '请输入 163 邮箱地址，例如 name@163.com'
    : '请输入 QQ 邮箱地址，例如 123456@qq.com';
}

function getEmailStatusLabel(status: EmailSettings['status']) {
  if (status === 'CONNECTED') return '已连接';
  if (status === 'ERROR') return '连接失败';
  return '未连接';
}

function getEmailStatusClass(status: EmailSettings['status']) {
  if (status === 'CONNECTED') {
    return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300';
  }
  if (status === 'ERROR') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300';
  }
  return 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-300';
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {children}
    </label>
  );
}

function StatusLine({
  success,
  error,
}: {
  success?: string | null;
  error?: string | null;
}) {
  if (!success && !error) return null;

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        error
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
          : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300'
      }`}
    >
      {error ?? success}
    </div>
  );
}

function CompactMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export function SettingsPage() {
  const { fetchMe } = useAuth();
  const {
    profile,
    marketData,
    importSettings,
    emailSettings,
    loading,
    saving,
    success,
    error,
    saveProfile,
    saveImportSettings,
    saveEmailSettings,
    testEmailConnection,
    disconnectEmail,
    refetch,
  } = useSettings();
  const systemStatus = useSystemStatus();
  const [profileName, setProfileName] = useState('');
  const [importForm, setImportForm] = useState<ImportSettings | null>(null);
  const [emailForm, setEmailForm] = useState<ReturnType<
    typeof createEmailForm
  > | null>(null);
  const [emailAuthCode, setEmailAuthCode] = useState('');
  const [syncStates, setSyncStates] = useState<Record<SyncActionKey, SyncActionState>>({
    recalculate: initialSyncState,
    refreshQuotes: initialSyncState,
    regenerateTrend: initialSyncState,
  });
  const [clearText, setClearText] = useState('');
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>('account');

  useEffect(() => {
    setProfileName(profile?.name ?? '');
  }, [profile?.name]);

  useEffect(() => {
    setImportForm(importSettings);
  }, [importSettings]);

  useEffect(() => {
    if (!emailSettings) return;
    setEmailForm(createEmailForm(emailSettings));
    setEmailAuthCode('');
  }, [emailSettings]);

  useEffect(() => {
    const updateActiveSection = () => {
      const headerOffset = 120;
      let nextSection: SettingsSectionId = navigationItems[0].id;

      for (const item of navigationItems) {
        const node = document.getElementById(sectionDomIds[item.id]);
        if (!node) continue;

        if (node.getBoundingClientRect().top <= headerOffset) {
          nextSection = item.id;
        }
      }

      setActiveSection(nextSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);

  const visibleStatus = useMemo(
    () => ({
      trades: systemStatus.status?.tradesCount ?? 0,
      positions: systemStatus.status?.positionsCount ?? 0,
      lastImportAt: systemStatus.status?.lastImportAt,
      lastQuoteUpdatedAt: systemStatus.status?.lastQuoteUpdatedAt,
    }),
    [systemStatus.status],
  );

  const scrollToSection = (id: SettingsSectionId) => {
    setActiveSection(id);
    document.getElementById(sectionDomIds[id])?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const setActionState = (
    key: SyncActionKey,
    nextState: Partial<SyncActionState>,
  ) => {
    setSyncStates((current) => ({
      ...current,
      [key]: { ...current[key], ...nextState },
    }));
  };

  const runSyncAction = async (
    key: SyncActionKey,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setActionState(key, {
      running: true,
      success: null,
      error: null,
    });

    try {
      await action();
      setActionState(key, {
        running: false,
        success: successMessage,
        error: null,
        lastRunAt: new Date().toISOString(),
      });
      await Promise.all([systemStatus.refetch(), refetch()]);
    } catch (requestError) {
      setActionState(key, {
        running: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : '操作失败，请稍后重试。',
      });
    }
  };

  const submitProfile = async () => {
    await saveProfile(profileName);
    await fetchMe();
  };

  const submitEmailSettings = async () => {
    if (!emailForm) return;
    await saveEmailSettings({
      ...emailForm,
      authCode: emailAuthCode.trim() || undefined,
    });
    setEmailAuthCode('');
  };

  const clearMyData = async () => {
    const confirmed = window.confirm(
      '此操作只会清空当前用户数据，不会清空公共 price_history。确认继续吗？',
    );
    if (!confirmed) return;

    setClearing(true);
    setClearError(null);
    setClearSuccess(null);
    try {
      const result = await portfolioMaintenanceService.clearMyData(clearText);
      const total = Object.values(result.deletedCounts).reduce(
        (sum, value) => sum + value,
        0,
      );
      setClearText('');
      setClearSuccess(`已清空 ${total} 条当前用户数据。`);
      await Promise.all([refetch(), systemStatus.refetch()]);
    } catch (requestError) {
      setClearError(
        requestError instanceof Error
          ? requestError.message
          : '清空数据失败，请稍后重试。',
      );
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 pb-12">
        <PageTitle title="Settings 设置" description="正在加载当前用户设置..." />
        <CardShell className="p-6 text-sm text-neutral-500">
          Loading settings...
        </CardShell>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <PageTitle
        title="Settings 设置"
        description="Manage your account, data sync, import preferences, and data safety."
      />

      <StatusLine success={success} error={error ?? systemStatus.error} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-1 md:sticky md:top-6 md:col-span-1 md:self-start">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              aria-current={activeSection === item.id ? 'true' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-6 md:col-span-2">
          <CardShell id={sectionDomIds.account} className="scroll-mt-6 p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
              Account 账户信息
            </h3>
            <div className="space-y-4">
              <div>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="max-w-md"
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={profile?.email ?? ''}
                  disabled
                  className="max-w-md bg-neutral-50 dark:bg-neutral-800/50"
                />
              </div>
              <div>
                <FieldLabel>Created At</FieldLabel>
                <Input
                  value={formatDateTime(profile?.createdAt)}
                  disabled
                  className="max-w-md bg-neutral-50 dark:bg-neutral-800/50"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={submitProfile} disabled={saving === 'profile'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving === 'profile' ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </CardShell>

          <CardShell id={sectionDomIds.email} className="scroll-mt-6 p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Email 邮件配置
                </h3>
                <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  使用 QQ 邮箱或 163 邮箱的 IMAP 授权码连接，为后续读取 IBKR 交易确认邮件 PDF 附件做准备。
                </p>
              </div>
              {emailSettings ? (
                <span
                  className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${getEmailStatusClass(
                    emailSettings.status,
                  )}`}
                >
                  {getEmailStatusLabel(emailSettings.status)}
                </span>
              ) : null}
            </div>

            {emailForm && emailSettings ? (
              <div className="space-y-4">
                <div>
                  <FieldLabel>邮箱服务商</FieldLabel>
                  <select
                    value={emailForm.provider}
                    onChange={(event) =>
                      setEmailForm({
                        ...emailForm,
                        provider: event.target.value as EmailSettings['provider'],
                      })
                    }
                    className="flex h-10 w-full max-w-md rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="QQ_MAIL">QQ 邮箱</option>
                    <option value="NETEASE_163">163 邮箱</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>邮箱地址</FieldLabel>
                  <Input
                    type="email"
                    value={emailForm.email}
                    onChange={(event) =>
                      setEmailForm({ ...emailForm, email: event.target.value })
                    }
                    placeholder={getEmailProviderHint(emailForm.provider)}
                    className="max-w-md"
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {getEmailProviderHint(emailForm.provider)}
                  </p>
                </div>

                <div>
                  <FieldLabel>邮箱授权码</FieldLabel>
                  <Input
                    type="password"
                    value={emailAuthCode}
                    onChange={(event) => setEmailAuthCode(event.target.value)}
                    placeholder={
                      emailSettings.hasAuthSecret
                        ? '已配置授权码，留空则继续保留'
                        : '请输入邮箱网页端生成的授权码'
                    }
                    autoComplete="new-password"
                    className="max-w-md"
                  />
                  <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <KeyRound className="h-3.5 w-3.5" />
                    {emailSettings.hasAuthSecret ? '已配置授权码' : '尚未配置授权码'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <CompactMetric
                    label="最近测试"
                    value={formatDateTime(emailSettings.lastTestAt)}
                  />
                  <CompactMetric
                    label="最近同步"
                    value={formatDateTime(emailSettings.lastSyncAt)}
                  />
                </div>

                {emailSettings.errorMessage ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                    {emailSettings.errorMessage}
                  </div>
                ) : null}

                {saving === 'emailTest' ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                    正在测试 IMAP 登录并只读打开 INBOX，请稍等...
                  </div>
                ) : null}

                {saving !== 'emailTest' && emailSettings.lastTestAt ? (
                  <div
                    className={`rounded-lg border p-3 text-sm ${getEmailStatusClass(
                      emailSettings.status,
                    )}`}
                  >
                    最近测试结果：{getEmailStatusLabel(emailSettings.status)}，
                    测试时间：{formatDateTime(emailSettings.lastTestAt)}
                    {emailSettings.status === 'CONNECTED'
                      ? '。IMAP 登录和 INBOX 打开成功。'
                      : null}
                  </div>
                ) : null}

                {emailSettings.status === 'CONNECTED' ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">邮箱已连接，可以开始扫描 IBKR 邮件。</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        扫描和 PDF 解析入口在 Imports 页面的 Email Import Tab。
                      </p>
                    </div>
                    <Link
                      to="/imports"
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 focus:ring-offset-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus:ring-white dark:focus:ring-offset-neutral-950"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      前往 Email Import 扫描
                    </Link>
                  </div>
                ) : null}

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                  <p>请先在对应邮箱网页端开启 IMAP/SMTP 服务，并生成授权码。</p>
                  <p>这里填写的是邮箱授权码，不是邮箱登录密码。</p>
                  <p>
                    TradePilot 只会读取 IBKR 交易确认邮件中的 PDF 附件，不会删除或发送邮件。
                  </p>
                </div>

                <div>
                  <FieldLabel>默认扫描范围</FieldLabel>
                  <select
                    value={emailForm.defaultScanRange}
                    onChange={(event) =>
                      setEmailForm({
                        ...emailForm,
                        defaultScanRange:
                          event.target.value as EmailSettings['defaultScanRange'],
                      })
                    }
                    className="flex h-10 w-full max-w-md rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="SCAN_3D">3d</option>
                    <option value="SCAN_7D">7d</option>
                    <option value="SCAN_30D">30d</option>
                    <option value="SCAN_90D">90d</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex max-w-md items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                    <span>只处理 IBKR 交易确认邮件</span>
                    <input
                      type="checkbox"
                      checked={emailForm.onlyIbkrEmails}
                      onChange={(event) =>
                        setEmailForm({
                          ...emailForm,
                          onlyIbkrEmails: event.target.checked,
                        })
                      }
                    />
                  </label>
                  <label className="flex max-w-md items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                    <span>只处理 PDF 附件</span>
                    <input
                      type="checkbox"
                      checked={emailForm.onlyPdfAttachments}
                      onChange={(event) =>
                        setEmailForm({
                          ...emailForm,
                          onlyPdfAttachments: event.target.checked,
                        })
                      }
                    />
                  </label>
                  <label className="flex max-w-md items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                    <span>同步后标记为已读</span>
                    <input
                      type="checkbox"
                      checked={emailForm.markAsRead}
                      onChange={(event) =>
                        setEmailForm({
                          ...emailForm,
                          markAsRead: event.target.checked,
                        })
                      }
                    />
                  </label>
                </div>

                <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  测试连接会使用已保存的邮箱地址和授权码。修改邮箱或授权码后，请先保存配置再测试。
                </p>

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={disconnectEmail}
                    disabled={
                      saving === 'emailDisconnect' ||
                      !emailSettings.hasAuthSecret
                    }
                  >
                    <Link2Off className="mr-2 h-4 w-4" />
                    {saving === 'emailDisconnect' ? 'Disconnecting...' : '断开连接'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={testEmailConnection}
                    disabled={
                      saving === 'emailTest' || !emailSettings.hasAuthSecret
                    }
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {saving === 'emailTest' ? 'Testing...' : '测试连接'}
                  </Button>
                  <Button
                    onClick={submitEmailSettings}
                    disabled={saving === 'emailSettings'}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving === 'emailSettings' ? 'Saving...' : '保存配置'}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardShell>

          <CardShell id={sectionDomIds['data-sync']} className="scroll-mt-6 p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Data & Sync 数据与同步
                </h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  常用数据维护操作，基于当前登录用户执行。
                </p>
              </div>
              <div className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                {marketData?.providerLabel ?? 'Yahoo Finance'}
              </div>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <CompactMetric label="交易记录" value={visibleStatus.trades} />
              <CompactMetric label="当前持仓" value={visibleStatus.positions} />
              <CompactMetric
                label="最近导入"
                value={formatDateTime(visibleStatus.lastImportAt)}
              />
              <CompactMetric
                label="最近行情"
                value={formatDateTime(visibleStatus.lastQuoteUpdatedAt)}
              />
            </div>

            <div className="space-y-3">
              <SyncAction
                title="重新计算投资数据"
                description="根据交易记录、现金流水和公司行动重新计算持仓、成本和资产指标。"
                state={syncStates.recalculate}
                onRun={() =>
                  runSyncAction(
                    'recalculate',
                    async () => {
                      await portfolioMaintenanceService.recalculatePositions();
                      await portfolioMaintenanceService.recalculateMetrics();
                    },
                    '投资数据已重新计算。',
                  )
                }
              />
              <SyncAction
                title="刷新当前行情"
                description="为当前持仓股票拉取最新价格，行情失败时会保留 warning，不影响页面使用。"
                state={syncStates.refreshQuotes}
                onRun={() =>
                  runSyncAction(
                    'refreshQuotes',
                    () => marketDataService.refreshQuotes(),
                    '当前行情已刷新。',
                  )
                }
              />
              <SyncAction
                title="重建月度趋势"
                description="根据交易记录和历史行情重新生成资产趋势数据。"
                state={syncStates.regenerateTrend}
                onRun={() =>
                  runSyncAction(
                    'regenerateTrend',
                    () => portfolioMaintenanceService.regenerateMonthlySnapshots(),
                    '月度趋势已重建。',
                  )
                }
              />
            </div>
          </CardShell>

          <CardShell id={sectionDomIds.import} className="scroll-mt-6 p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
              Import 导入设置
            </h3>
            {importForm ? (
              <div className="space-y-4">
                <div>
                  <FieldLabel>默认数据源</FieldLabel>
                  <Input
                    value="IBKR CSV"
                    disabled
                    className="max-w-md bg-neutral-50 dark:bg-neutral-800/50"
                  />
                </div>
                <div>
                  <FieldLabel>导入重复记录时</FieldLabel>
                  <select
                    value={importForm.duplicateStrategy}
                    onChange={(event) =>
                      setImportForm({
                        ...importForm,
                        duplicateStrategy: toDuplicateStrategy(event.target.value),
                      })
                    }
                    className="flex h-10 w-full max-w-md rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="SKIP">自动跳过重复记录</option>
                    <option value="UPDATE_EMPTY_FIELDS">
                      自动补全已有记录缺失字段
                    </option>
                  </select>
                </div>
                <label className="flex max-w-md items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                  <span>导入完成后自动刷新数据</span>
                  <input
                    type="checkbox"
                    checked={isAutoRefreshEnabled(importForm)}
                    onChange={(event) =>
                      setImportForm({
                        ...importForm,
                        autoRefreshQuotesAfterImport: event.target.checked,
                        autoRegenerateSnapshotsAfterImport: event.target.checked,
                        autoRecalculateMetricsAfterImport: event.target.checked,
                      })
                    }
                  />
                </label>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => saveImportSettings(importForm)}
                    disabled={saving === 'importSettings'}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving === 'importSettings' ? 'Saving...' : 'Save Import'}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardShell>

          <CardShell
            id={sectionDomIds['danger-zone']}
            className="scroll-mt-6 border-red-200 p-6 dark:border-red-900/60"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                Danger Zone 危险操作
              </h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              清空当前用户的交易记录、现金流水、导入记录、快照和设置。此操作不可恢复，不会清空公共 price_history。
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                value={clearText}
                onChange={(event) => setClearText(event.target.value)}
                placeholder="输入 CLEAR"
              />
              <Button
                variant="danger"
                disabled={clearText !== 'CLEAR' || clearing}
                onClick={clearMyData}
                className="shrink-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {clearing ? 'Clearing...' : 'Clear My Data'}
              </Button>
            </div>
            <div className="mt-4">
              <StatusLine success={clearSuccess} error={clearError} />
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  );
}

function SyncAction({
  title,
  description,
  state,
  onRun,
}: {
  title: string;
  description: string;
  state: SyncActionState;
  onRun: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div>
        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
          {title}
        </h4>
        <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
          <span>Last run: {formatDateTime(state.lastRunAt)}</span>
          {state.success ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {state.success}
            </span>
          ) : null}
          {state.error ? <span className="text-red-600">{state.error}</span> : null}
        </div>
      </div>
      <Button variant="outline" size="sm" disabled={state.running} onClick={onRun}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {state.running ? 'Running...' : 'Run'}
      </Button>
    </div>
  );
}
