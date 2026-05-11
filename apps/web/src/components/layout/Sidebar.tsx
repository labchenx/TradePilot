import { LogOut, User } from 'lucide-react';
import { NavLink } from 'react-router';
import { navigationItems } from '@/data';
import { cn } from '@/utils';

export function Sidebar() {
  return (
    <aside className="relative z-20 flex w-[72px] flex-col items-center border-r border-neutral-200 bg-white py-4 transition-colors duration-200 dark:border-neutral-800/60 dark:bg-[#111111]">
      <div className="mb-6 flex h-12 items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black shadow-sm dark:bg-white">
          <span className="text-xl font-bold leading-none text-white dark:text-black">T</span>
        </div>
      </div>

      <nav className="scrollbar-hide flex w-full flex-1 flex-col items-center space-y-3 overflow-y-auto px-3">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-neutral-100 text-black shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-black dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white',
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <div className="pointer-events-none absolute left-full z-50 ml-4 origin-left translate-x-2 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-white dark:text-black">
              <div className="flex flex-col">
                <span>{item.label}</span>
                <span className="text-[10px] font-normal leading-tight opacity-70">{item.zhLabel}</span>
              </div>
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-neutral-900 dark:border-r-white" />
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex w-full flex-col items-center gap-4 border-t border-neutral-200 pt-6 pb-2 dark:border-neutral-800/60">
        <div className="group relative">
          <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-neutral-100 transition-all hover:ring-2 hover:ring-neutral-200 dark:bg-neutral-800 dark:hover:ring-neutral-700">
            <User className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          </div>
          <div className="pointer-events-none absolute bottom-0 left-full z-50 ml-4 origin-left translate-x-2 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-white dark:text-black">
            <div className="flex flex-col">
              <span>Demo User</span>
              <span className="text-[10px] font-normal leading-tight opacity-70">user@tradepilot.com</span>
            </div>
            <div className="absolute bottom-3 -left-1 border-[5px] border-transparent border-r-neutral-900 dark:border-r-white" />
          </div>
        </div>

        <NavLink
          to="/login"
          className="group relative flex h-12 w-12 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5" />
          <div className="pointer-events-none absolute left-full z-50 ml-4 origin-left translate-x-2 whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            Log Out 退出登录
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-red-600" />
          </div>
        </NavLink>
      </div>
    </aside>
  );
}

