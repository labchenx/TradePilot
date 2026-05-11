import { RouterProvider } from "react-router";
import { ThemeProvider } from "./components/theme-provider";
import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tradepilot-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
