# Current Stage：Performance 收益分析页开发

## 1. 当前阶段目标

本阶段目标是开发 Performance 收益分析页，用于在已有数据基础上，对投资组合的收益表现、资产配置、盈亏贡献和交易行为进行汇总分析。

当前已完成模块：

- Overview 首页总览
- Holdings 当前持仓
- Transactions 交易明细
- Cash Flows 现金流水

Performance 页面不负责录入数据，而是基于前面模块已经沉淀的数据进行分析展示。

核心目标：

```text
让用户能快速回答：
1. 我的整体投资收益表现如何？
2. 收益主要来自哪些股票？
3. 当前资产配置是否集中？
4. 已实现盈亏和未实现盈亏分别是多少？
5. 资产变化和净入金之间的关系是什么？
```

---

## 2. 页面名称与路由

建议新增页面：

```text
/Performance 
```

页面名称：

```text
Performance  收益分析
```

导航名称建议：

```text
分析
```

---

## 3. 数据来源

本阶段不要重新读取 CSV 文件，不要使用 mock 数据，也不要直接读取 IBKR 报表中的期末汇总结果。

Performance 页面应基于数据库中的：

- trades / transactions 交易记录
- cash_flows 资金流水
- positions 当前持仓
- corporate_actions 公司行动
- quotes 当前行情
- price_history 历史行情
- portfolio_monthly_snapshots 月末资产快照
- position_monthly_snapshots 月末持仓快照

优先复用已有：

- portfolio service
- position service
- transaction service
- cash flow service
- quote service
- monthly snapshot service

不要在 React 页面组件中写复杂计算逻辑。

---

## 4. 页面结构

### 4.1 顶部收益概览卡片

建议展示 5 到 6 个核心指标：

```text
总资产 Total Assets
总收益 Total Return
总收益率 Return Rate
已实现盈亏 Realized P/L
未实现盈亏 Unrealized P/L
净入金 Net Deposit
```

计算口径：

```text
totalAssets = cashBalance + stockMarketValue

totalReturn = totalAssets - netDeposit

returnRate = totalReturn / netDeposit

realizedPnl = sum(trades.realizedPnl)

unrealizedPnl = stockMarketValue - totalCostBasis

netDeposit = sum(DEPOSIT) + sum(WITHDRAWAL)
```

注意：

- 如果 netDeposit 为 0，returnRate 返回 null，页面显示 `--`
- 盈利用绿色，亏损用红色
- 金额统一格式化为 USD
- 百分比保留 2 位小数
- 这些指标需要和 Overview / Holdings 页面保持一致

---

## 5. 图表模块

### 5.1 资产趋势图

目标：展示资产变化和净入金之间的关系。

建议图表：折线图 / 面积图。

展示指标：

```text
总资产 Total Assets
净入金 Net Deposit
总收益 Total Return，可选
```

数据来源：

```text
portfolio_monthly_snapshots
```

计算口径：

```text
每月月末总资产 = 月末现金余额 + 月末股票市值
每月月末总收益 = 月末总资产 - 月末净入金
```

注意：

- 不要每次打开页面都全量重算交易记录
- 优先读取月末快照
- 如果快照不存在，可以提示用户先生成快照，或者调用已有 snapshot service 生成

---

### 5.2 资产配置图

目标：展示当前资产配置。

建议图表：饼图 / 环形图 / 横向条形图。

展示维度：

```text
股票市值 Stock Market Value
现金 Cash Balance
各股票持仓占比 Allocation by Symbol
```

第一版建议先做：

```text
按股票 symbol 展示持仓市值占比
```

计算口径：

```text
weight = position.marketValue / stockMarketValue
```

注意：

- 只统计 quantity > 0 的当前持仓
- 缺少行情时，对该股票显示 warning
- 占比应与 Holdings 页面保持一致

---

### 5.3 盈亏贡献图

目标：展示每只股票对收益的贡献。

建议图表：横向柱状图。

展示字段：

```text
symbol
realizedPnl
unrealizedPnl
totalPnl = realizedPnl + unrealizedPnl
```

计算口径：

```text
每只股票总盈亏 = 已实现盈亏 + 未实现盈亏
```

注意：

- realizedPnl 优先使用数据库中 IBKR 解析出的 realizedPnl 字段
- unrealizedPnl 来自当前持仓市值 - 当前持仓成本
- 盈利绿色，亏损红色
- 默认按 totalPnl 从高到低排序

---

### 5.4 已实现 vs 未实现盈亏对比

目标：展示收益中已落袋和未落袋部分的比例。

建议图表：双柱图 / donut / 简单卡片对比。

展示指标：

```text
Realized P/L 已实现盈亏
Unrealized P/L 未实现盈亏
```

注意：

- 已实现盈亏不包含未实现盈亏
- 未实现盈亏依赖当前行情
- 如果行情缺失，未实现盈亏显示 `--`

---

### 5.5 月度入金出金图，可选

如果 Cash Flows 页面已经只保留入金和出金，本页可以增加一个月度资金流图。

建议图表：柱状图。

展示指标：

```text
每月入金 Deposits
每月出金 Withdrawals
每月净入金 Net Deposit Change
```

注意：

- 只统计 DEPOSIT / WITHDRAWAL
- 不统计股票买卖、股息、税费、手续费
- 如果时间不够，本阶段可以先不做

---

## 6. 筛选器

建议支持时间范围筛选：

```text
1个月
3个月
今年
过去一年
全部
```

第一版可以只作用于趋势图和月度统计图。

持仓配置和当前盈亏贡献默认使用当前持仓快照，不一定需要跟随时间筛选。

如果实现成本较高，可以先保留 UI，不做复杂联动。

---

## 7. API 设计

如果已有 portfolio summary / snapshot API，优先复用。

如果没有，建议新增：

```text
GET /api/portfolio/analytics
```

返回结构建议：

```ts
export interface AnalyticsSummary {
  totalAssets: number | null;
  totalReturn: number | null;
  returnRate: number | null;
  realizedPnl: number;
  unrealizedPnl: number | null;
  netDeposit: number;
}

export interface AssetTrendPoint {
  month: string;
  date: string;
  totalAssets: number | null;
  netDeposit: number;
  totalReturn: number | null;
}

export interface AllocationItem {
  symbol: string;
  name?: string;
  marketValue: number | null;
  weight: number | null;
}

export interface PnlContributionItem {
  symbol: string;
  name?: string;
  realizedPnl: number;
  unrealizedPnl: number | null;
  totalPnl: number | null;
}

export interface RealizedVsUnrealized {
  realizedPnl: number;
  unrealizedPnl: number | null;
}

export interface MonthlyCashFlowPoint {
  month: string;
  deposits: number;
  withdrawals: number;
  netDepositChange: number;
}

export interface PortfolioAnalyticsResponse {
  summary: AnalyticsSummary;
  assetTrend: AssetTrendPoint[];
  allocation: AllocationItem[];
  pnlContribution: PnlContributionItem[];
  realizedVsUnrealized: RealizedVsUnrealized;
  monthlyCashFlows?: MonthlyCashFlowPoint[];
  warnings: string[];
  updatedAt?: string;
}
```

---

## 8. Service 建议

建议新增或完善：

```text
src/
  services/
    analytics/
      analytics-service.ts
      allocation-calculator.ts
      pnl-contribution-calculator.ts
      performance-trend-service.ts
    portfolio/
      portfolio-service.ts
      monthly-snapshot-service.ts
    market-data/
      quote-service.ts
```

要求：

- 页面只调用 API 或 hook
- 复杂计算放在 service 中
- 复用已有 summary / positions / transactions / cash flow / snapshot 逻辑
- 避免重复实现已经存在的计算逻辑

---

## 9. 页面 UI 要求

整体风格保持和现有页面一致：

```text
白底卡片
圆角
轻阴影
清晰留白
金融数据面板风格
中英文混排但不拥挤
```

页面建议布局：

```text
顶部：页面标题 + 简短说明 + 时间筛选器
第一行：收益概览卡片
第二行：资产趋势图，大卡片
第三行：资产配置图 + 已实现/未实现对比
第四行：盈亏贡献图
可选：月度入金出金图
```

注意：

- 图表不要过多颜色
- 盈利用绿色，亏损用红色
- 次要文字用灰色
- 图例要简洁
- 避免大面积厚重灰色块

---

## 10. 容错要求

需要处理以下状态：

1. 数据加载中 loading
2. 数据为空 empty
3. 接口错误 error
4. 行情缺失 warnings
5. 月末快照缺失 warnings
6. 某只股票缺少成本或行情
7. netDeposit 为 0 导致收益率无法计算

处理方式：

- 页面不能崩溃
- 无法计算的指标显示 `--`
- warnings 用轻提示展示
- 可以展示可正常计算的部分数据

---

## 11. 本阶段不做的事情

本阶段暂不做：

- 单只股票详情页
- 行业分类分析
- 严格 TWR / MWR 收益率
- 税务分析
- AI 投资建议
- 新闻摘要
- 多账户合并
- 多币种完整汇率换算
- 复杂回测

---

## 12. 验收标准

完成后需要满足：

1. 新增  Performance 页面
2. 页面数据来自数据库和已有 service，不使用 mock 数据
3. 总资产、总收益、收益率等指标与 Overview 保持一致
4. 持仓占比与 Holdings 页面保持一致
5. 已实现盈亏优先使用 IBKR realizedPnl 字段
6. 资产趋势优先读取月末快照数据
7. 页面包含资产趋势、资产配置、盈亏贡献等核心分析图表
8. 支持 loading / empty / error / warnings 状态
9. UI 风格与现有页面保持一致
10. 复杂计算逻辑不写在 React 页面组件中