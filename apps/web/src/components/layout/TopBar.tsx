import { CloudCog, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router';
import { useTheme } from '@/app/theme-provider';
import { navigationItems } from '@/data';

function getPageTitle(pathname: string) {
  const currentNav = navigationItems.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );

  if (pathname.startsWith('/trading-behavior')) return '交易行为分析';
  if (pathname.startsWith('/stock/')) return 'Stock Detail / 个股详情';
  if (pathname === '/login') return 'Login / 登录';
  return currentNav ? `${currentNav.label} / ${currentNav.zhLabel}` : 'TradePilot';
}

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-8 backdrop-blur-md transition-colors duration-200 dark:border-neutral-800/60 dark:bg-[#111111]/80">
      <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
        {getPageTitle(location.pathname)}
      </h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-neutral-200/50 bg-neutral-100 px-3 py-1.5 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
          <CloudCog className="h-4 w-4" />
          <span>Sync: 2 hrs ago</span>
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
