# Current State - TradePilot Frontend UI Refactor

## 1. 当前阶段目标

当前项目处于前端 UI 工程化整理阶段。

我已经使用 Figma Make 生成了一版 React UI 代码。接下来需要将这批代码整理成一个可维护、可继续开发的 React 前端项目结构。

本阶段的目标不是重新设计 UI，也不是实现完整后端接口，而是：

- 保留 Figma Make 生成的页面视觉效果
- 整理 React 组件结构
- 规范 TypeScript 类型
- 拆分页面、布局、业务组件和通用组件
- 清理重复代码和无用代码
- 建立 mock 数据层
- 建立后续接入真实 API 的基础结构
- 确保项目可以正常启动、构建和维护

## 2. 项目背景

项目名称暂定为 TradePilot。

TradePilot 是一个面向个人投资者的历史交易数据分析平台，主要用于整理和展示用户的股票交易记录、持仓、收益、资金流和交易行为。

当前 MVP 的核心闭环是：

```txt
上传 / 粘贴 IBKR 交易记录
        ↓
解析交易数据
        ↓
预览解析结果
        ↓
确认导入
        ↓
生成交易历史
        ↓
计算当前持仓和收益
        ↓
Dashboard 展示
```

第一阶段不做复杂回测，不做自动交易，不做投资建议。

## 3. 当前已有内容

目前已经有：

- Figma Make 生成的 React UI 代码
- 若干页面级 UI
- 静态页面结构
- 部分组件代码
- 可能存在重复组件、重复样式、未规范命名、未拆分数据逻辑等问题

Figma Make 生成的代码主要用于视觉参考，不代表最终工程结构。

## 4. 本阶段不做的事情

本阶段不要做以下事情：

- 不要重做 UI 设计
- 不要大幅改变页面视觉风格
- 不要引入复杂状态管理
- 不要接入真实后端接口
- 不要实现 IBKR Flex Query
- 不要实现邮箱自动读取
- 不要实现登录注册后端逻辑
- 不要加入复杂的投资收益算法
- 不要加入 AI 分析功能
- 不要删除主要页面功能

如果发现某些页面逻辑不完整，可以先用 mock 数据和 TODO 注释保留扩展点。

## 5. 技术方向

前端技术栈优先保持为：

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS 或当前项目已有样式方案
- ECharts / Recharts 可后续接入，不在本阶段强行实现

如果当前项目已经使用了某些 UI 组件库或样式方案，请优先沿用，不要无必要更换。

## 6. 推荐目录结构

请将前端代码整理为类似结构：

```txt
src/
  app/
    App.tsx
    router.tsx

  layouts/
    MainLayout.tsx

  pages/
    DashboardPage.tsx
    TransactionsPage.tsx
    HoldingsPage.tsx
    ImportPage.tsx
    PerformancePage.tsx
    CashFlowPage.tsx
    BehaviorPage.tsx
    SettingsPage.tsx

  components/
    common/
      Button.tsx
      Card.tsx
      EmptyState.tsx
      PageHeader.tsx
      StatCard.tsx

    layout/
      Sidebar.tsx
      Header.tsx

    dashboard/
      PortfolioSummary.tsx
      AssetAllocation.tsx
      RecentTransactions.tsx
      PerformanceChart.tsx

    transactions/
      TransactionTable.tsx
      TransactionFilters.tsx

    holdings/
      HoldingsTable.tsx
      HoldingCard.tsx

    import/
      ImportUploader.tsx
      ImportPreviewTable.tsx
      ImportSteps.tsx

  data/
    mockTransactions.ts
    mockHoldings.ts
    mockDashboard.ts

  types/
    transaction.ts
    holding.ts
    dashboard.ts
    import.ts

  hooks/
    useTransactions.ts
    useHoldings.ts
    useDashboard.ts

  services/
    apiClient.ts
    transactionService.ts
    holdingService.ts
    importService.ts

  utils/
    formatCurrency.ts
    formatPercent.ts
    formatDate.ts
    calculateReturn.ts

  styles/
    globals.css
```

如果当前项目结构已经存在，请在不破坏现有启动方式的前提下进行整理。

## 7. 页面范围

当前至少需要保留以下页面或导航入口。

### Dashboard

展示：

- 总资产
- 总收益
- 今日 / 本月 / 累计收益
- 当前持仓概览
- 最近交易记录
- 收益走势图占位
- 资产分布占位

### Transactions

展示：

- 股票交易历史表格
- 买入 / 卖出类型
- 股票代码
- 交易日期
- 数量
- 成交价格
- 手续费
- 总金额
- 已实现盈亏，如暂时没有可以 mock

### Holdings

展示：

- 当前持仓
- 股票代码
- 持仓数量
- 平均成本
- 当前价格
- 当前市值
- 未实现盈亏
- 收益率

### Import

展示：

- 上传 CSV / 粘贴邮件内容入口
- 解析预览区域
- 确认导入按钮
- 导入状态提示

### Performance

展示：

- 按股票维度的收益分析
- 已实现盈亏
- 未实现盈亏
- 累计收益
- 收益贡献

### Cash Flow

展示：

- 入金
- 出金
- 净入金
- 分红
- 手续费

### Behavior

展示：

- 交易次数
- 买入 / 卖出频率
- 持仓周期
- 高频交易提示
- 仓位集中度提示

### Settings

展示：

- 基础偏好设置入口
- 账户信息占位
- 数据导入设置占位

## 8. 数据约定

本阶段使用 mock 数据。

请将页面中写死的数据抽离到 `src/data/`。

基础类型可以包括：

```ts
export type TradeSide = "BUY" | "SELL";

export interface Transaction {
  id: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fee: number;
  tradeDate: string;
  amount: number;
  realizedPnL?: number;
  currency: string;
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  currency: string;
}

export interface DashboardSummary {
  totalMarketValue: number;
  netDeposit: number;
  totalPnL: number;
  totalReturnPercent: number;
  realizedPnL: number;
  unrealizedPnL: number;
}
```

后续真实 API 接入时，应尽量复用这些类型。

## 9. 代码整理要求

请重点完成：

- 页面组件拆分
- 公共组件抽取
- mock 数据抽离
- TypeScript 类型补充
- 重复样式整理
- 命名规范化
- 删除无用 import
- 删除未使用变量
- 保持 ESLint / TypeScript 通过
- 保持页面视觉基本不变
- 保持路由可访问
- 保持项目可以正常运行

## 10. 验证方式

完成后请运行：

```bash
npm install
npm run dev
npm run build
```

如果项目中已有 lint 或 typecheck 命令，也请运行：

```bash
npm run lint
npm run typecheck
```

如果某些命令不存在，不要强行新增复杂配置，可以在总结中说明。

## 11. 交付结果

完成后请给出：

- 修改了哪些目录
- 拆出了哪些组件
- 新增了哪些 mock 数据
- 新增了哪些类型
- 还有哪些 TODO
- 项目是否可以正常 build
- 后续建议的下一步开发任务
