import { Navigate, createBrowserRouter } from 'react-router';
import { MainLayout } from '@/layouts/MainLayout';
import { BehaviorPage } from '@/pages/BehaviorPage';
import { CashFlowPage } from '@/pages/CashFlowPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HoldingsPage } from '@/pages/HoldingsPage';
import { ImportPage } from '@/pages/ImportPage';
import { LoginPage } from '@/pages/LoginPage';
import { NewsPage } from '@/pages/NewsPage';
import { PerformancePage } from '@/pages/PerformancePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StockDetailPage } from '@/pages/StockDetailPage';
import { TransactionsPage } from '@/pages/TransactionsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'transactions', Component: TransactionsPage },
      { path: 'trades', element: <Navigate to="/transactions" replace /> },
      { path: 'holdings', Component: HoldingsPage },
      { path: 'positions', element: <Navigate to="/holdings" replace /> },
      { path: 'import', Component: ImportPage },
      { path: 'performance', Component: PerformancePage },
      { path: 'cash-flows', Component: CashFlowPage },
      { path: 'trading-behavior', Component: BehaviorPage },
      { path: 'behavior', element: <Navigate to="/trading-behavior" replace /> },
      { path: 'news', Component: NewsPage },
      { path: 'stock/:symbol', Component: StockDetailPage },
      { path: 'settings', Component: SettingsPage },
    ],
  },
]);
