import { Navigate, createBrowserRouter } from 'react-router';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/layouts/MainLayout';
import { BehaviorPage } from '@/pages/BehaviorPage';
import { CashFlowPage } from '@/pages/CashFlowPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HoldingsPage } from '@/pages/HoldingsPage';
import { ImportPage } from '@/pages/ImportPage';
import { LoginPage } from '@/pages/LoginPage';
import { NewsPage } from '@/pages/NewsPage';
import { PerformancePage } from '@/pages/PerformancePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StockDetailPage } from '@/pages/StockDetailPage';
import { TransactionsPage } from '@/pages/TransactionsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', Component: DashboardPage },
      { path: 'transactions', Component: TransactionsPage },
      { path: 'trades', element: <Navigate to="/transactions" replace /> },
      { path: 'holdings', Component: HoldingsPage },
      { path: 'positions', element: <Navigate to="/holdings" replace /> },
      { path: 'imports', Component: ImportPage },
      { path: 'import', element: <Navigate to="/imports" replace /> },
      { path: 'performance', Component: PerformancePage },
      { path: 'analytics', element: <Navigate to="/performance" replace /> },
      { path: 'cash-flows', Component: CashFlowPage },
      { path: 'trading-behavior', Component: BehaviorPage },
      { path: 'behavior', element: <Navigate to="/trading-behavior" replace /> },
      { path: 'news', Component: NewsPage },
      { path: 'stock/:symbol', Component: StockDetailPage },
      { path: 'settings', Component: SettingsPage },
    ],
  },
]);
