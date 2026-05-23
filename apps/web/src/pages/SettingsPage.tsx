import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '@/app/auth-provider';
import { Button, CardShell, Input, PageTitle } from '@/components/common';
import { useSettings, useSystemStatus } from '@/hooks';
import {
  marketDataService,
  portfolioMaintenanceService,
} from '@/services';
import type { ImportSettings } from '@/types';

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
  { id: 'data-sync', label: 'Data & Sync', icon: Database },
  { id: 'import', label: 'Import', icon: FileText },
  { id: 'danger-zone', label: 'Danger Zone', icon: Shield },
] as const;

type SettingsSectionId = (typeof navigationItems)[number]['id'];

const sectionDomIds: Record<SettingsSectionId, string> = {
  account: 'settings-account',
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
    loading,
    saving,
    success,
    error,
    saveProfile,
    saveImportSettings,
    refetch,
  } = useSettings();
  const systemStatus = useSystemStatus();
  const [profileName, setProfileName] = useState('');
  const [importForm, setImportForm] = useState<ImportSettings | null>(null);
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
