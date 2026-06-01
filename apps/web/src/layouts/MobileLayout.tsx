import {
  ArrowRightLeft,
  LayoutDashboard,
  LogOut,
  Moon,
  Newspaper,
  PieChart,
  Settings,
  Sun,
  Upload,
  Wallet,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/app/auth-provider';
import { useTheme } from '@/app/theme-provider';
import { cn } from '@/utils';

const navItems = [
  { path: '/dashboard', label: '总览', icon: LayoutDashboard },
  { path: '/holdings', label: '持仓', icon: PieChart },
  { path: '/transactions', label: '交易', icon: ArrowRightLeft },
  { path: '/cash-flows', label: '现金', icon: Wallet },
  // { path: '/imports', label: '导入', icon: Upload },
  // { path: '/news', label: '资讯', icon: Newspaper },
  { path: '/settings', label: '设置', icon: Settings },
];

function getMobileTitle(pathname: string) {
  if (pathname.startsWith('/holdings') || pathname.startsWith('/positions')) return '当前持仓';
  if (pathname.startsWith('/transactions') || pathname.startsWith('/trades')) return '交易明细';
  if (pathname.startsWith('/cash-flows')) return '现金流水';
  if (pathname.startsWith('/imports') || pathname.startsWith('/import')) return '数据导入';
  if (pathname.startsWith('/news')) return '股票资讯';
  if (pathname.startsWith('/settings')) return '设置';
  return '投资总览';
}

export function MobileLayout() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-neutral-50 text-neutral-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-neutral-50">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-md dark:border-neutral-800/60 dark:bg-[#111111]/95">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black shadow-sm dark:bg-white">
            <span className="text-base font-bold leading-none text-white dark:text-black">
              T
            </span>
          </div>
          <h1 className="truncate text-base font-semibold text-neutral-800 dark:text-neutral-100">
            {getMobileTitle(location.pathname)}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            aria-label="退出登录"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="mx-auto min-h-full w-full max-w-md px-4 py-4">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur-md dark:border-neutral-800/60 dark:bg-[#111111]/95">
        <div className="flex h-16 items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-all duration-200',
                  isActive
                    ? 'text-black dark:text-white'
                    : 'text-neutral-400 dark:text-neutral-500',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      isActive && 'scale-110',
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
