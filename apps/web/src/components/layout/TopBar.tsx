import { CloudCog, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router';
import { useTheme } from '@/app/theme-provider';
import { navigationItems } from '@/data';
import { useSystemStatus } from '@/hooks';
import type { SettingsStatus } from '@/types';

function getPageTitle(pathname: string) {
  const currentNav = navigationItems.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );

  if (pathname.startsWith('/trading-behavior')) return '交易行为分析';
  if (pathname.startsWith('/stock/')) return 'Stock Detail / 个股详情';
  if (pathname === '/login') return 'Login / 登录';
  return currentNav ? `${currentNav.label} / ${currentNav.zhLabel}` : 'TradePilot';
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLatestDataSyncAt(status: SettingsStatus | null) {
  if (!status) return null;
  return parseDate(status.lastDataSyncAt);
}

function formatRelativeSyncTime(value: Date | null) {
  if (!value) return '--';

  const diffMs = Date.now() - value.getTime();
  if (diffMs < 60_000) return 'just now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return value.toLocaleString();
}

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { status, loading } = useSystemStatus();
  const latestDataSyncAt = getLatestDataSyncAt(status);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-8 backdrop-blur-md transition-colors duration-200 dark:border-neutral-800/60 dark:bg-[#111111]/80">
      <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
        {getPageTitle(location.pathname)}
      </h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-neutral-200/50 bg-neutral-100 px-3 py-1.5 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
          <CloudCog className="h-4 w-4" />
          <span title={latestDataSyncAt?.toLocaleString()}>
            Sync: {loading ? 'loading...' : formatRelativeSyncTime(latestDataSyncAt)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 focus:outline-none dark:text-neutral-400 dark:hover:bg-white/10"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
