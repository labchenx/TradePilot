import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth-provider';
import { ThemeProvider } from './theme-provider';
import { router } from './router';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tradepilot-ui-theme">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
