# Current Stage：Trading Behavior 交易行为分析页开发

## 1. 当前阶段目标

本阶段目标是新增 **Trading Behavior 交易行为分析页**，用于从交易记录中分析用户的交易频率、买卖金额、交易活跃股票、手续费消耗、胜率和已实现盈亏贡献。

当前项目已经完成：

- Overview 首页
- Holdings 当前持仓
- Transactions 交易明细
- Cash Flows 现金流水
- Analytics / Performance 收益分析页

本阶段重点从“交易过程”角度做分析，帮助用户复盘自己的交易行为。

---

## 2. 页面定位

Trading Behavior 页面回答的问题：

```text
我交易是否频繁？
我主要交易了哪些股票？
买入金额和卖出金额如何变化？
哪些股票贡献了最多已实现收益？
手续费消耗了多少？
卖出交易的胜率如何？
```

它和 Analytics 页面区别：

- Analytics 偏结果分析：总资产、收益、配置、盈亏贡献
- Trading Behavior 偏行为分析：交易频率、买卖节奏、交易金额、交易活跃度、手续费、卖出胜率

---

## 3. 页面路由与名称

建议新增页面：

```text
/trading-behavior
```

页面名称：

```text
Trading Behavior
交易行为
```

导航名称：

```text
交易行为
```

如果项目已有侧边栏或顶部导航，需要增加入口。

---

## 4. 数据来源

数据来自数据库中已经入库的交易记录。

主要依赖：

```text
trades / transactions
```

不要重新读取 CSV 文件。

不要使用 mock 数据。

不要直接读取 IBKR 报表中的期末汇总结果。

如果已有 transaction service，优先复用。

如果没有现成接口，建议新增：

```text
GET /api/portfolio/trading-behavior
```

---

## 5. 页面核心模块

### 5.1 顶部概览卡片

页面顶部展示交易行为概览：

```text
Total Trades 总交易次数
Buy Trades 买入次数
Sell Trades 卖出次数
Traded Symbols 交易股票数
Total Commission 总手续费
Realized P/L 已实现盈亏
Avg Trade Amount 平均单笔交易金额
Win Rate 胜率
```

计算口径：

```text
totalTrades = BUY + SELL 交易数量
buyTrades = BUY 交易数量
sellTrades = SELL 交易数量
tradedSymbols = distinct symbol count
totalCommission = sum(abs(commission))
realizedPnl = sum(realizedPnl)
avgTradeAmount = sum(abs(amount)) / totalTrades
winRate = realizedPnl > 0 的卖出交易数 / 有 realizedPnl 的卖出交易数
```

注意：

- realizedPnl 优先使用数据库中从 IBKR 解析出的 realizedPnl 字段
- 不要默认用 FIFO 重新计算 realizedPnl
- 如果 realizedPnl 为空，则该笔交易不参与胜率计算
- 如果没有可计算胜率的卖出交易，winRate 返回 null，页面显示 `--`

---

## 6. 图表模块

### 6.1 月度交易次数图

展示每月交易次数。

建议图表类型：

```text
柱状图 / 堆叠柱状图
```

展示指标：

```text
每月 BUY 次数
每月 SELL 次数
每月总交易次数
```

数据结构示例：

```ts
export interface MonthlyTradeCount {
  month: string;
  buyCount: number;
  sellCount: number;
  totalCount: number;
}
```

---

### 6.2 月度买卖金额图

展示每月买入和卖出金额。

展示指标：

```text
buyAmount
sellAmount
netBuyAmount
```

计算口径：

```text
buyAmount = sum(abs(amount)) where side = BUY
sellAmount = sum(abs(amount)) where side = SELL
netBuyAmount = buyAmount - sellAmount
```

注意：

- 展示金额时使用绝对值，避免因为数据库中 BUY 为负数导致图表难以理解
- 可以在 tooltip 中说明买入金额和卖出金额均按绝对值展示

---

### 6.3 个股交易活跃度排行

展示每只股票的交易活跃情况。

建议展示为表格或横向柱状图。

字段：

```text
symbol
name
tradeCount
buyCount
sellCount
buyAmount
sellAmount
commission
realizedPnl
```

默认排序：

```text
tradeCount desc
```

可支持排序字段：

```text
tradeCount
buyAmount
sellAmount
commission
realizedPnl
symbol
```

---

### 6.4 已实现盈亏贡献图

展示每只股票的已实现盈亏贡献。

建议图表类型：

```text
横向柱状图
```

字段：

```text
symbol
realizedPnl
```

展示规则：

- 盈利使用绿色
- 亏损使用红色
- 默认按 realizedPnl 从高到低排序
- realizedPnl 为空或 0 的股票可以放在后面

---

## 7. 筛选与交互

### 7.1 时间范围筛选

支持：

```text
1个月
3个月
今年
全部
```

如果项目已有统一时间筛选组件，优先复用。

### 7.2 Symbol 筛选

支持按 symbol 筛选交易行为数据。

例如：

```text
NVDA
MSFT
TSLA
```

如果选择某个 symbol：

- 顶部卡片只统计该股票
- 月度交易次数图只统计该股票
- 月度买卖金额图只统计该股票
- 已实现盈亏贡献图可以隐藏或只展示该股票

### 7.3 搜索

如果页面中有交易活跃度表格，支持按 symbol / name 搜索。

---

## 8. API 返回结构建议

建议返回统一结构：

```ts
export interface TradingBehaviorSummary {
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  tradedSymbolCount: number;
  totalCommission: number;
  realizedPnl: number;
  avgTradeAmount: number | null;
  winRate: number | null;
}

export interface MonthlyTradeCount {
  month: string;
  buyCount: number;
  sellCount: number;
  totalCount: number;
}

export interface MonthlyTradeAmount {
  month: string;
  buyAmount: number;
  sellAmount: number;
  netBuyAmount: number;
}

export interface SymbolTradingStats {
  symbol: string;
  name?: string;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  buyAmount: number;
  sellAmount: number;
  commission: number;
  realizedPnl: number;
}

export interface RealizedPnlContribution {
  symbol: string;
  realizedPnl: number;
}

export interface TradingBehaviorResponse {
  summary: TradingBehaviorSummary;
  monthlyTradeCounts: MonthlyTradeCount[];
  monthlyTradeAmounts: MonthlyTradeAmount[];
  symbolStats: SymbolTradingStats[];
  realizedPnlContributions: RealizedPnlContribution[];
  warnings: string[];
}
```

---

## 9. 计算口径说明

### 9.1 交易范围

本页面只统计股票买卖交易：

```text
BUY
SELL
```

不统计：

```text
DEPOSIT
WITHDRAWAL
DIVIDEND
TAX
FEE
INTEREST
FX_EXCHANGE
```

这些属于现金流水或其它模块。

### 9.2 买入金额

```text
buyAmount = sum(abs(amount)) where side = BUY
```

### 9.3 卖出金额

```text
sellAmount = sum(abs(amount)) where side = SELL
```

### 9.4 净买入金额

```text
netBuyAmount = buyAmount - sellAmount
```

含义：

- 正数：该月净买入
- 负数：该月净卖出

### 9.5 手续费

```text
totalCommission = sum(abs(commission))
```

如果数据库中 commission 已经是负数，展示时仍用正数表达“手续费消耗”。

### 9.6 已实现盈亏

```text
realizedPnl = sum(trades.realizedPnl)
```

优先使用数据库中 IBKR 解析出来的 realizedPnl 字段。

不要默认重新用 FIFO 计算。

### 9.7 胜率

```text
winRate = 盈利卖出交易数 / 有 realizedPnl 的卖出交易数
```

其中：

```text
盈利卖出交易 = side = SELL 且 realizedPnl > 0
有 realizedPnl 的卖出交易 = side = SELL 且 realizedPnl != null
```

如果分母为 0：

```text
winRate = null
```

页面显示：

```text
--
```

---

## 10. 页面 UI 要求

整体风格与已完成页面保持一致：

```text
白底卡片
圆角
轻阴影
金融数据面板风格
中英文混排但不拥挤
图表简洁清晰
```

图表要求：

- 不要使用过多颜色
- BUY 和 SELL 使用稳定且易区分的颜色
- 盈利用绿色，亏损用红色
- Tooltip 简洁
- 坐标轴文字不要过重
- 缺少数据时显示 empty 状态

---

## 11. 状态处理

页面需要支持：

```text
loading
empty
error
warnings
```

### 11.1 loading

数据加载中显示 skeleton 或 loading spinner。

### 11.2 empty

如果没有交易记录，显示空状态：

```text
暂无交易行为数据
```

### 11.3 error

接口失败时显示错误提示。

### 11.4 warnings

例如：

```text
部分交易缺少 amount，已跳过金额统计
部分卖出交易缺少 realizedPnl，未参与胜率计算
部分交易缺少 commission，手续费统计可能不完整
```

---

## 12. Service / Hook 设计建议

不要在 React 页面组件中写复杂统计逻辑。

建议结构：

```text
src/
  services/
    trading-behavior/
      trading-behavior-service.ts
      trading-behavior-calculator.ts
      trading-behavior-types.ts
  hooks/
    use-trading-behavior.ts
  app/
    trading-behavior/
      page.tsx
```

如果项目不是 Next.js，请根据当前项目结构调整。

---

## 13. 验收标准

完成后需要满足：

1. 新增 Trading Behavior / 交易行为页面
2. 页面只使用数据库中的交易记录，不读取 CSV
3. 不使用 mock 数据
4. 顶部卡片能展示交易次数、买入次数、卖出次数、手续费、已实现盈亏、胜率等指标
5. 能按月展示交易次数
6. 能按月展示买入金额、卖出金额和净买入金额
7. 能展示个股交易活跃度排行
8. 能展示按 symbol 的已实现盈亏贡献
9. 支持时间范围筛选
10. 支持 symbol 筛选
11. realizedPnl 优先使用数据库中 IBKR realizedPnl 字段
12. 缺少 realizedPnl 时不会导致页面崩溃
13. 支持 loading / empty / error / warnings 状态
14. UI 风格和现有页面保持一致
15. 不影响已完成的 Overview、Holdings、Transactions、Cash Flows、Analytics 页面