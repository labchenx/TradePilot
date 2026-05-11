import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Trades } from "./pages/Trades";
import { ImportIBKR } from "./pages/Import";
import { CashFlows } from "./pages/CashFlows";
import { Positions } from "./pages/Positions";
import { StockDetail } from "./pages/StockDetail";
import { News } from "./pages/News";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "trades", Component: Trades },
      { path: "import", Component: ImportIBKR },
      { path: "cash-flows", Component: CashFlows },
      { path: "positions", Component: Positions },
      { path: "stock/:symbol", Component: StockDetail },
      { path: "news", Component: News },
      { path: "settings", Component: Settings },
    ],
  },
]);
