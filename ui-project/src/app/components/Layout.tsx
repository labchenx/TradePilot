import { NavLink, Outlet, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  MailPlus, 
  Wallet, 
  PieChart, 
  Newspaper, 
  Settings,
  Sun,
  Moon,
  CloudCog,
  User,
  LogOut
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTheme } from "./theme-provider";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: "/", label: "Dashboard", zhLabel: "投资总览", icon: LayoutDashboard },
  { path: "/trades", label: "Trades", zhLabel: "交易记录", icon: ArrowRightLeft },
  { path: "/import", label: "Import IBKR", zhLabel: "邮件导入", icon: MailPlus },
  { path: "/cash-flows", label: "Cash Flows", zhLabel: "资金流水", icon: Wallet },
  { path: "/positions", label: "Positions", zhLabel: "当前持仓", icon: PieChart },
  { path: "/news", label: "News & AI", zhLabel: "股票资讯", icon: Newspaper },
  { path: "/settings", label: "Settings", zhLabel: "设置", icon: Settings },
];

export function AppLayout() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const currentNav = navItems.find((n) => 
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  );
  
  const pageTitle = currentNav ? `${currentNav.label} / ${currentNav.zhLabel}` : "TradePilot";

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-50 font-sans transition-colors duration-200">
      {/* Collapsed Sidebar */}
      <aside className="w-[72px] border-r border-neutral-200 dark:border-neutral-800/60 bg-white dark:bg-[#111111] flex flex-col items-center py-4 transition-colors duration-200 z-20 relative">
        <div className="h-12 flex items-center justify-center mb-6">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white dark:text-black font-bold text-xl leading-none">T</span>
          </div>
        </div>
        
        <nav className="flex-1 w-full flex flex-col items-center space-y-3 overflow-y-auto px-3 scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-neutral-100 dark:bg-white/10 text-black dark:text-white shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                )
              }
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-200", location.pathname === item.path && "scale-110")} />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl origin-left translate-x-2 group-hover:translate-x-0">
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-70 font-normal leading-tight">{item.zhLabel}</span>
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-[5px] border-transparent border-r-neutral-900 dark:border-r-white"></div>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 pb-2 w-full flex flex-col items-center gap-4 border-t border-neutral-200 dark:border-neutral-800/60 mt-auto">
          <div className="group relative">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-neutral-200 dark:hover:ring-neutral-700 transition-all">
              <User className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </div>
            
            {/* User Tooltip */}
            <div className="absolute left-full ml-4 bottom-0 px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl origin-left translate-x-2 group-hover:translate-x-0">
              <div className="flex flex-col">
                <span>Demo User</span>
                <span className="text-[10px] opacity-70 font-normal leading-tight">user@tradepilot.com</span>
              </div>
              <div className="absolute bottom-3 -left-1 border-[5px] border-transparent border-r-neutral-900 dark:border-r-white"></div>
            </div>
          </div>
          
          <NavLink to="/login" className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5" />
            
            {/* Logout Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl origin-left translate-x-2 group-hover:translate-x-0">
              Log Out 退出登录
              <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-[5px] border-transparent border-r-red-600"></div>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-neutral-200 dark:border-neutral-800/60 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-md z-10 transition-colors duration-200 sticky top-0">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">{pageTitle}</h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-neutral-200/50 dark:border-white/10">
              <CloudCog className="w-4 h-4" />
              <span>Sync: 2 hrs ago</span>
            </div>
            
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-600 dark:text-neutral-400 focus:outline-none"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
