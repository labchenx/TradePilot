import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth-provider';
import { ThemeProvider } from './theme-provider';
import { router } from './router';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tradepilot-ui-theme">
      <AuthProvider>
        <OfflineIndicator />
        <RouterProvider router={router} />
        <PWAInstallPrompt />
      </AuthProvider>
    </ThemeProvider>
  );
}
