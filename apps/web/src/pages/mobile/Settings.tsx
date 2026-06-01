import {
  CheckCircle2,
  Database,
  LogOut,
  Mail,
  Smartphone,
  User,
  Wifi,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/auth-provider';
import { useSettings, useSystemStatus } from '@/hooks';
import { cn } from '@/utils';
import { MobileError, MobileLoading } from './MobileState';
import { dateTimeText, statusClass } from './mobileFormat';

export function MobileSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, emailSettings, loading, error } = useSettings();
  const systemStatus = useSystemStatus();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  if (loading) return <MobileLoading label="加载设置..." />;

  const displayName = profile?.name || user?.name || 'TradePilot User';
  const displayEmail = profile?.email || user?.email || '--';
  const emailConnected = emailSettings?.status === 'CONNECTED';

  return (
    <div className="space-y-4">
      {error ? <MobileError message={error} /> : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-neutral-900 dark:text-white">
              {displayName}
            </h3>
            <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
              {displayEmail}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
            账户信息
          </h4>
        </div>
        <SettingRow
          icon={User}
          tone="blue"
          title="当前用户"
          description={displayEmail}
        />
        <SettingRow
          icon={Database}
          tone="orange"
          title="数据状态"
          description={`${systemStatus.status?.tradesCount ?? 0} trades · ${systemStatus.status?.positionsCount ?? 0} positions`}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
            邮箱同步
          </h4>
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {emailSettings?.providerLabel ?? 'Email Sync'}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {emailSettings?.email ?? '尚未配置邮箱'}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs font-semibold',
                emailConnected ? statusClass('green') : statusClass('gray'),
              )}
            >
              {emailSettings?.status ?? 'DISCONNECTED'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Info label="Auto Sync" value={emailSettings?.autoSyncEnabled ? 'Enabled' : 'Disabled'} />
            <Info label="Time" value={emailSettings?.syncTime ?? '07:00'} />
            <Info label="Last Sync" value={dateTimeText(emailSettings?.lastSyncAt)} />
            <Info label="Status" value={emailSettings?.lastSyncStatus ?? '--'} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              PWA 安装入口
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-300">
              浏览器支持安装时，页面底部会自动出现 TradePilot 安装提示。安装后会复用同一登录状态和 API token。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start gap-3">
          <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              离线提示
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              网络不可用时只显示离线状态提示，不缓存用户隐私 API 响应。
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 font-semibold text-red-600 transition-transform active:scale-[0.98] dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      >
        <LogOut className="h-5 w-5" />
        退出登录
      </button>

      <div className="py-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
        TradePilot · Mobile H5/PWA
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  tone: 'blue' | 'orange';
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';

  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5 last:border-b-0 dark:border-neutral-800">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', toneClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
          {title}
        </p>
        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>
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
