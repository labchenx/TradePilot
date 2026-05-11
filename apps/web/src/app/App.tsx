import { RouterProvider } from 'react-router';
import { ThemeProvider } from './theme-provider';
import { router } from './router';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tradepilot-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

