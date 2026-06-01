import { Navigate, createBrowserRouter } from 'react-router';
import { ResponsiveRoute } from '@/components/common/ResponsiveRoute';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute';
import { ResponsiveLayout } from '@/layouts/ResponsiveLayout';
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
import { MobileCashFlows } from '@/pages/mobile/CashFlows';
import { MobileDashboard } from '@/pages/mobile/Dashboard';
import { MobileImport } from '@/pages/mobile/Import';
import { MobileNews } from '@/pages/mobile/News';
import { MobilePositions } from '@/pages/mobile/Positions';
import { MobileSettings } from '@/pages/mobile/Settings';
import { MobileTrades } from '@/pages/mobile/Trades';

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
        <ResponsiveLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <ResponsiveRoute desktop={DashboardPage} mobile={MobileDashboard} />,
      },
      {
        path: 'transactions',
        element: <ResponsiveRoute desktop={TransactionsPage} mobile={MobileTrades} />,
      },
      { path: 'trades', element: <Navigate to="/transactions" replace /> },
      {
        path: 'holdings',
        element: <ResponsiveRoute desktop={HoldingsPage} mobile={MobilePositions} />,
      },
      { path: 'positions', element: <Navigate to="/holdings" replace /> },
      {
        path: 'imports',
        element: <ResponsiveRoute desktop={ImportPage} mobile={MobileImport} />,
      },
      { path: 'import', element: <Navigate to="/imports" replace /> },
      { path: 'performance', Component: PerformancePage },
      { path: 'analytics', element: <Navigate to="/performance" replace /> },
      {
        path: 'cash-flows',
        element: <ResponsiveRoute desktop={CashFlowPage} mobile={MobileCashFlows} />,
      },
      { path: 'trading-behavior', Component: BehaviorPage },
      { path: 'behavior', element: <Navigate to="/trading-behavior" replace /> },
      {
        path: 'news',
        element: <ResponsiveRoute desktop={NewsPage} mobile={MobileNews} />,
      },
      { path: 'stock/:symbol', Component: StockDetailPage },
      {
        path: 'settings',
        element: <ResponsiveRoute desktop={SettingsPage} mobile={MobileSettings} />,
      },
    ],
  },
]);
