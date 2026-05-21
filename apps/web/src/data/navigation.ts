import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  LayoutDashboard,
  MailPlus,
  Newspaper,
  PieChart,
  Settings,
  Wallet,
} from 'lucide-react';
import type { NavigationItem } from '@/types';

export const navigationItems: NavigationItem[] = [
  { path: '/', label: 'Dashboard', zhLabel: '投资总览', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', zhLabel: '交易记录', icon: ArrowRightLeft },
  { path: '/holdings', label: 'Holdings', zhLabel: '当前持仓', icon: PieChart },
  { path: '/import', label: 'Import', zhLabel: '邮件导入', icon: MailPlus },
  { path: '/performance', label: 'Performance', zhLabel: '收益分析', icon: BarChart3 },
  { path: '/cash-flows', label: 'Cash Flow', zhLabel: '资金流水', icon: Wallet },
  { path: '/trading-behavior', label: 'Trading Behavior', zhLabel: '交易行为', icon: Activity },
  { path: '/news', label: 'News & AI', zhLabel: '股票资讯', icon: Newspaper },
  { path: '/settings', label: 'Settings', zhLabel: '设置', icon: Settings },
];
