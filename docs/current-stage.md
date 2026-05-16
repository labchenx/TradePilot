# Current Stage - Dashboard Data Integration

## 1. 当前阶段目标

当前阶段目标是：

> 基于已经入库的 IBKR CSV 交易流水数据，为 Dashboard / 投资总览首页接入真实数据。

前面阶段已经围绕 IBKR CSV 完成或正在完成：

```txt
CSV 文件
  ↓
解析 Transaction History
  ↓
标准化为 transaction_events
  ↓
导入数据库
```

本阶段不继续修改 CSV parser，不重做首页 UI，而是基于已经入库的 `transaction_events` 数据，生成 Dashboard 首页需要的统计数据、图表数据和排行榜数据。

---

## 2. 当前阶段重点

本阶段重点不是“把代码堆到一个接口里”，而是：

- 后端按功能模块拆分计算逻辑
- 前端按 Dashboard 模块接入 API
- 代码注释尽量完整，方便后续学习
- 保留当前首页 UI，只替换 mock 数据来源
- 明确哪些数据是真实计算，哪些数据因为缺少行情数据暂时是估算

---

## 3. Dashboard 首页模块

首页目前需要展示以下模块：

```txt
1. Summary Overview 顶部整体概览
2. Asset Trend 资产走势
3. Allocation 持仓占比
4. Return Breakdown 收益构成
5. Realized P/L by Symbol 单股票已实现盈亏
6. Recent Trades 最近交易
```

后端和前端都应围绕这几个模块拆分代码。

---

## 4. 后端接口设计

建议提供以下接口：

```txt
GET /dashboard/summary
GET /dashboard/asset-trend
GET /dashboard/allocation
GET /dashboard/return-breakdown
GET /dashboard/realized-pnl-by-symbol
GET /dashboard/recent-trades
```

如果项目更适合聚合接口，也可以增加：

```txt
GET /dashboard
```

但内部代码仍然需要按功能拆分，不要把所有计算逻辑写在一个大函数中。

---

## 5. 建议后端目录结构

如果当前项目已有 NestJS 后端结构，建议新增或整理为：

```txt
src/dashboard/
  dashboard.module.ts
  dashboard.controller.ts
  dashboard.service.ts

  calculators/
    dashboard-summary.calculator.ts
    asset-trend.calculator.ts
    allocation.calculator.ts
    return-breakdown.calculator.ts
    realized-pnl.calculator.ts
    recent-trades.calculator.ts

  dto/
    dashboard-summary.dto.ts
    asset-trend.dto.ts
    allocation.dto.ts
    return-breakdown.dto.ts
    realized-pnl-by-symbol.dto.ts
    recent-trade.dto.ts
```

如果当前项目结构不同，可以基于现有结构调整，但需要保持职责清晰。

---

## 6. Summary Overview 顶部整体概览

### 6.1 需要返回字段

```ts
export interface DashboardSummaryDto {
  totalAssets: number;
  stockMarketValue: number;
  cashBalance: number;
  netDeposit: number;
  totalPnl: number;
  returnRate: number;
  realizedPnl: number;
  realizedNetIncome: number;

  estimated: {
    stockMarketValue: boolean;
    totalAssets: boolean;
    totalPnl: boolean;
    returnRate: boolean;
  };

  warnings?: string[];
}
```

### 6.2 字段说明

| 字段                | 中文说明     | 当前阶段计算方式                   |
| ------------------- | ------------ | ---------------------------------- |
| `totalAssets`       | 总资产       | 股票市值 + 现金余额                |
| `stockMarketValue`  | 股票市值     | 当前没有行情时，用剩余持仓成本估算 |
| `cashBalance`       | 现金余额     | 汇总所有 `netAmount`               |
| `netDeposit`        | 净入金       | 只统计 `DEPOSIT` 和 `WITHDRAWAL`   |
| `totalPnl`          | 总收益       | 总资产 - 净入金                    |
| `returnRate`        | 收益率       | 总收益 / 净入金                    |
| `realizedPnl`       | 已实现盈亏   | 平均成本法计算                     |
| `realizedNetIncome` | 已实现净收益 | 已实现盈亏 + 股息 + 税费利息等     |

### 6.3 注意

当前没有行情数据，所以：

```txt
stockMarketValue = 剩余持仓成本估算值
totalAssets = 估算股票市值 + 现金余额
totalPnl = 估算总资产 - 净入金
returnRate = 估算总收益 / 净入金
```

需要在代码注释和返回字段中标记 `estimated = true`。

---

## 7. Cash Balance 现金余额

现金余额根据 `transaction_events.netAmount` 汇总。

需要包含所有事件：

- 买入
- 卖出
- 存款
- 取款
- 股息
- 替代支付
- 外国预扣税
- 借方利息
- 其它费用
- 调整
- 外汇交易组成部分

说明：

```txt
买入 netAmount 通常为负数
卖出 netAmount 通常为正数
存款通常为正数
取款通常为负数
股息通常为正数
税费、利息、费用通常为负数
```

因此现金余额可以直接对 `netAmount` 求和。

---

## 8. Net Deposit 净入金

净入金只统计外部资金流：

```txt
DEPOSIT
WITHDRAWAL
```

计算公式：

```txt
netDeposit = sum(DEPOSIT.netAmount) + sum(WITHDRAWAL.netAmount)
```

注意：

- 取款在 CSV 中通常已经是负数
- 不要把股息、卖出收入、税费算入净入金
- 净入金代表用户真正投入账户的本金口径

---

## 9. Realized P/L 已实现盈亏

第一版使用：

```txt
AVERAGE_COST 平均成本法
```

### 9.1 计算规则

1. 只处理 `TRADE_BUY` 和 `TRADE_SELL`
2. 按 `symbol` 分组
3. 每个 symbol 内按 `tradeDate` 升序排序
4. 如果同一天有多笔交易，按 `rawRowIndex` 升序排序

### 9.2 买入逻辑

```txt
buyQuantity = quantity
buyCost = abs(netAmount)

currentQuantity += buyQuantity
currentCost += buyCost
```

### 9.3 卖出逻辑

```txt
sellQuantity = abs(quantity)
sellProceeds = netAmount

averageCost = currentCost / currentQuantity
allocatedCost = sellQuantity * averageCost
realizedPnl = sellProceeds - allocatedCost

currentQuantity -= sellQuantity
currentCost -= allocatedCost
```

### 9.4 异常处理

如果出现：

```txt
sellQuantity > currentQuantity
```

需要：

- 记录 warning
- 不要静默忽略
- 标记该 symbol 需要人工检查

---

## 10. Realized Net Income 已实现净收益

计算公式：

```txt
realizedNetIncome =
  realizedPnl
  + dividendTotal
  + paymentInLieuTotal
  + withholdingTaxTotal
  + debitInterestTotal
  + otherFeeTotal
```

注意：

- 税费、利息、费用在数据库中通常已经是负数
- 因此可以直接相加
- 已实现净收益不包含未卖出持仓的浮动盈亏

---

## 11. Return Breakdown 收益构成

需要返回：

```ts
export interface ReturnBreakdownDto {
  realizedPnl: number;
  unrealizedPnl: number | null;
  dividends: number;
  paymentInLieu: number;
  feesAndTaxes: number;
  total: number | null;
}
```

当前没有行情数据时：

```txt
unrealizedPnl = null
```

前端可以显示：

```txt
待接入行情
```

不要伪造未实现盈亏。

---

## 12. Allocation 持仓占比

当前没有行情数据时，先使用“持仓成本口径”估算持仓占比。

### 12.1 返回字段

```ts
export interface AllocationItemDto {
  symbol: string;
  type: 'STOCK' | 'CASH';
  value: number;
  percent: number;
  estimated: boolean;
}
```

### 12.2 计算逻辑

1. 根据买卖记录计算每只股票剩余持仓数量和剩余成本
2. 用 `remainingCost` 暂时作为该股票的估算价值
3. 加入 `Cash` 现金余额
4. 计算各项占总资产比例

说明：

```txt
当前 value 是成本口径估算，不是实时市值。
后续接入行情数据后，需要替换为 marketValue。
```

---

## 13. Asset Trend 资产走势

第一版可以按月份聚合。

### 13.1 返回字段

```ts
export interface AssetTrendPointDto {
  month: string;
  totalAssets: number;
  netDeposit: number;
  totalPnl: number;
  estimated: boolean;
}
```

### 13.2 当前阶段估算逻辑

在没有历史行情数据时：

```txt
月度总资产 = 当月现金余额 + 当月剩余持仓成本
```

注意：

```txt
这是成本口径估算资产走势，不代表真实历史市值走势。
```

代码注释中需要明确说明这一点。

---

## 14. Realized P/L by Symbol 单股票已实现盈亏

### 14.1 返回字段

```ts
export interface RealizedPnlBySymbolDto {
  symbol: string;
  realizedPnl: number;
  realizedPnlPercent: number;
  totalSellProceeds: number;
  totalAllocatedCost: number;
  soldQuantity: number;
  remainingQuantity: number;
  remainingCost: number;
  averageCost: number;
  tradeCount: number;
  method: 'AVERAGE_COST';
}
```

### 14.2 排序规则

首页默认返回 Top 5。

排序可以采用：

```txt
realizedPnl 绝对值倒序
```

或者：

```txt
realizedPnl 倒序
```

如果 Figma 首页设计区分盈利和亏损列表，可以后续再拆分为：

```txt
盈利贡献 Top 5
亏损来源 Top 5
```

---

## 15. Recent Trades 最近交易

只返回最近 5 条买卖交易。

### 15.1 只包含

```txt
TRADE_BUY
TRADE_SELL
```

### 15.2 返回字段

```ts
export interface RecentTradeDto {
  date: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  commission: number;
}
```

排序：

```txt
tradeDate DESC
rawRowIndex DESC
```

---

## 16. 前端接入要求

前端需要将 Dashboard 页面从 mock 数据切换到 API 数据。

不要在 `DashboardPage` 中写复杂计算逻辑。

建议前端结构：

```txt
src/services/dashboardService.ts

src/hooks/dashboard/
  useDashboardSummary.ts
  useAssetTrend.ts
  useAllocation.ts
  useReturnBreakdown.ts
  useRealizedPnlBySymbol.ts
  useRecentTrades.ts
```

如果当前项目已有 API service 或 hooks 结构，请沿用现有方式。

---

## 17. Dashboard 页面职责

`DashboardPage` 只负责组合 UI：

```txt
SummaryCards
AssetTrendChart
AllocationCard
ReturnBreakdownCard
RealizedPnlBySymbolCard
RecentTradesCard
```

不要在页面组件中写复杂计算逻辑。

---

## 18. 注释要求

本阶段代码需要添加中文注释，方便后期学习。

重点注释：

1. 每个 calculator 文件顶部说明它负责计算什么
2. 平均成本法 realized P/L 的每一步要有注释
3. `netDeposit` 为什么只统计 `DEPOSIT / WITHDRAWAL`
4. `realizedNetIncome` 为什么要加股息、税费、利息
5. 当前没有行情数据时，哪些字段是估算值
6. 前端 hook 中说明数据来源和返回结构
7. 关键 service 方法说明输入和输出

---

## 19. 空状态和异常处理

需要处理：

1. `transaction_events` 为空时，返回 0 或空数组，不要报错
2. 没有卖出记录时，已实现盈亏为 0
3. 没有行情数据时，未实现盈亏返回 `null`
4. 卖出数量大于当前持仓时，返回 warnings
5. 前端请求 loading 状态
6. 前端请求失败状态
7. 除数为 0 时收益率返回 0 或 null，避免 NaN

---

## 20. 本阶段不做

本阶段不要做：

- 不重新设计首页 UI
- 不修改 sidebar / layout
- 不修改 CSV parser
- 不接行情 API
- 不接 AI API
- 不做登录权限
- 不大改数据库结构
- 不引入复杂状态管理
- 不重构无关页面
- 不实现完整 Performance 页面

---

## 21. 验证命令

完成后请运行：

```bash
npm run build
```

如果项目存在以下命令，也请运行：

```bash
npm run lint
npm run typecheck
npm run test
```

如果命令不存在，不要强行新增复杂配置，请在最终说明中说明。

---

## 22. 交付说明要求

完成后请说明：

1. 新增或修改了哪些文件
2. 后端 Dashboard 数据如何分块计算
3. 平均成本法已实现盈亏如何计算
4. 哪些数据是真实 CSV 入库后可计算的
5. 哪些数据目前是估算值
6. 前端 Dashboard 哪些模块已经接入 API
7. 是否保留当前首页 UI
8. build / lint / typecheck / test 是否通过
9. 下一步建议做什么

---

## 23. 下一阶段预期

本阶段完成后，下一阶段可以进入：

```txt
Stage 3 - Market Price Integration
```

下一阶段可以考虑：

- 接入行情 API
- 用实时价格计算股票市值
- 计算未实现盈亏
- 将资产走势从成本口径升级为市值口径
- 首页展示真实总资产和真实收益率