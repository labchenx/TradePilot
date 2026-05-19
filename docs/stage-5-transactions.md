# Current Stage：Transactions 交易明细页开发

## 1. 当前阶段目标

本阶段目标是新增并完善「Transactions 交易明细页」。

当前系统已经完成：

- Overview 首页
- Holdings 当前持仓页
- 当前持仓市值、成本、未实现盈亏展示
- 基础行情服务与持仓计算逻辑

下一步需要通过交易明细页展示所有买入、卖出记录，用于排查和校验：

```text
持仓数量是怎么来的
持仓成本是怎么来的
已实现盈亏是怎么来的
某只股票的买卖记录是否完整
IBKR 数据解析是否正确
```

交易明细页不是简单列表页，而是后续排查数据问题的核心页面。

---

## 2. 背景说明

CSV 交易记录已经完成入库。

本阶段不要重新读取 CSV 文件，也不要使用 mock 数据。

交易明细页应该基于数据库中已经标准化后的交易记录展示，包括：

- 股票买入记录
- 股票卖出记录
- 成交数量
- 成交价格
- 成交金额
- 佣金
- 已实现盈亏
- 币种
- 来源文件或导入来源
- 原始记录 rawRecord，若数据库中已保留

本阶段不要重写 Overview 首页，也不要重写 Holdings 当前持仓页。

---

## 3. 页面名称与路由

建议新增页面：

```text
/transactions
```

页面名称：

```text
Transactions 交易明细
```

导航名称：

```text
交易
```

如果项目已有侧边栏或顶部导航，需要加入入口。

---

## 4. 页面核心作用

Transactions 页面主要用于：

```text
1. 查看全部买入 / 卖出记录
2. 按股票排查交易历史
3. 校验当前持仓数量
4. 校验持仓成本
5. 校验已实现盈亏
6. 排查重复交易或异常记录
7. 查看原始导入记录
```

本页面需要服务于后续数据校验和问题排查，因此字段要清晰、筛选要实用。

---

## 5. 页面结构

页面建议分为四部分：

```text
1. 页面标题区
2. 顶部交易概览卡片
3. 筛选与搜索区域
4. 交易明细表格
```

可选：

```text
5. 点击行后打开交易详情抽屉 / 弹窗
```

---

## 6. 顶部交易概览卡片

建议展示以下指标：

```text
Total Trades 总交易数
Buy Amount 买入总额
Sell Amount 卖出总额
Commission 总佣金
Realized P/L 已实现盈亏
Traded Symbols 交易股票数
```

### 6.1 指标口径

#### Total Trades 总交易数

```text
totalTrades = 交易记录总数
```

只统计股票交易记录，不统计现金流水、股息、税费等非交易记录。

#### Buy Amount 买入总额

```text
buyAmount = sum(abs(amount) for BUY trades)
```

注意：

- 只统计 BUY
- 展示为正数
- 不要把 SELL 算进去
- 如果数据库中 BUY amount 已经是负数，展示时取绝对值

#### Sell Amount 卖出总额

```text
sellAmount = sum(abs(amount) for SELL trades)
```

注意：

- 只统计 SELL
- 展示为正数
- 不要把 BUY 算进去

#### Commission 总佣金

```text
commission = sum(abs(commission))
```

注意：

- 佣金通常是负数或费用字段
- 页面展示为成本/费用时可显示正数
- 如果要展示为现金影响，可以保留负数，但需要统一项目现有风格

#### Realized P/L 已实现盈亏

优先使用数据库中从 IBKR 解析出的 realizedPnl 字段：

```text
realizedPnl = sum(trades.realizedPnl)
```

注意：

- realizedPnl 为空的交易不参与统计
- 不要默认用 FIFO 结果覆盖 IBKR realizedPnl
- realizedPnl 只统计已实现盈亏，不包含未实现盈亏

#### Traded Symbols 交易股票数

```text
tradedSymbolCount = 去重后的 symbol 数量
```

---

## 7. 交易明细表格

### 7.1 表格字段

交易表格至少展示以下字段：

```text
Date 日期
Symbol / Name 股票代码和名称
Side 买入/卖出
Quantity 数量
Price 成交价
Amount 成交金额
Commission 佣金
Realized P/L 已实现盈亏
Currency 币种
Source 来源
Action 操作
```

### 7.2 字段说明

#### Date 日期

展示交易日期。

建议格式：

```text
YYYY-MM-DD
```

如果有成交时间，可以后续扩展。

#### Symbol / Name 股票代码和名称

展示：

```text
AMD
Advanced Micro Devices
```

如果数据库中没有 name，可以只展示 symbol。

#### Side 买入/卖出

展示：

```text
BUY
SELL
```

或：

```text
买入
卖出
```

建议：

- BUY 使用蓝色或中性色
- SELL 使用橙色或红色
- 样式使用轻量 badge，不要过重

#### Quantity 数量

展示为正数。

注意：

- BUY 和 SELL 都展示正数数量
- 方向由 Side 字段表达
- 不要让 SELL 数量显示成负数，避免阅读混乱

#### Price 成交价

展示成交价格。

```text
$150.00
```

#### Amount 成交金额

展示成交金额。

建议口径：

```text
BUY amount 可以展示为负数或成本
SELL amount 可以展示为正数
```

为了更直观，也可以：

- BUY：显示 `-$1,500.00`
- SELL：显示 `+$1,800.00`

但需要与项目现有金额格式保持一致。

#### Commission 佣金

展示该笔交易佣金。

```text
$1.00
```

如果数据库中佣金为负数，可以展示绝对值，或保留负数，但要统一。

#### Realized P/L 已实现盈亏

展示该笔交易已实现盈亏。

注意：

- BUY 通常显示 `--`
- SELL 如果有 realizedPnl，展示金额
- 盈利用绿色
- 亏损用红色
- 为空显示 `--`

#### Currency 币种

当前阶段可以主要展示：

```text
USD
```

但字段需要保留，方便后续多币种扩展。

#### Source 来源

展示来源，例如：

```text
IBKR
CSV Import
```

如果数据库中有导入批次或文件名，可以展示更具体来源。

#### Action 操作

可包含：

```text
View 查看
```

点击后打开交易详情。

---

## 8. 搜索与筛选

本阶段至少支持：

```text
1. symbol / name 搜索
2. BUY / SELL 筛选
3. 日期排序
```

建议支持：

```text
4. 日期范围筛选
5. realizedPnl 盈利 / 亏损筛选
6. symbol 多选筛选
```

如果时间有限，优先完成基础能力。

### 8.1 搜索

支持输入：

```text
MSFT
Microsoft
NVDA
Tesla
```

搜索范围：

- symbol
- name

### 8.2 Side 筛选

选项：

```text
全部
BUY
SELL
```

### 8.3 排序

至少支持：

```text
date
amount
realizedPnl
symbol
quantity
```

默认排序：

```text
date desc
```

最新交易排在最前。

---

## 9. 交易详情抽屉 / 弹窗

点击某一行时，可以打开详情面板。

详情内容建议包括：

```text
交易日期
股票代码
股票名称
买卖方向
成交数量
成交价格
成交金额
佣金
已实现盈亏
币种
来源
导入批次
原始记录 rawRecord
```

如果 rawRecord 数据较长，可以折叠展示。

这个功能主要用于排查导入和解析问题。

---

## 10. 数据来源与 API

如果项目已有交易查询接口，优先复用。

如果没有，建议新增：

```text
GET /api/portfolio/transactions
```

返回结构建议：

```ts
export interface TransactionSummary {
  totalTrades: number;
  buyAmount: number;
  sellAmount: number;
  commission: number;
  realizedPnl: number;
  tradedSymbolCount: number;
}

export interface TransactionItem {
  id: string;
  date: string;
  symbol: string;
  name?: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  commission?: number;
  realizedPnl?: number | null;
  currency: string;
  source?: string;
  importBatchId?: string;
  rawRecord?: unknown;
}

export interface TransactionsResponse {
  summary: TransactionSummary;
  transactions: TransactionItem[];
  warnings: string[];
}
```

---

## 11. Service / Hook 结构

不要在 React 页面组件中写复杂统计逻辑。

建议结构：

```text
src/
  services/
    transactions/
      transaction-service.ts
      transaction-summary-calculator.ts
      transaction-normalizer.ts
  hooks/
    use-transactions.ts
  app/
    transactions/
      page.tsx
```

如果项目不是 Next.js，请按照当前项目结构适配。

页面组件只负责：

```text
1. 调用 hook 或 API
2. 展示 loading
3. 展示 error
4. 展示 empty
5. 展示 summary cards
6. 展示 filters
7. 展示 table
8. 展示 transaction detail drawer
```

---

## 12. 数据口径注意事项

### 12.1 不要重新读取 CSV

当前数据已经入库。

本阶段所有数据来自数据库中的标准化交易表。

### 12.2 不要使用 mock 数据

页面应该展示真实数据库数据。

如果数据库没有数据，展示 empty 状态。

### 12.3 不要混入现金流水

Transactions 页面只展示股票交易记录。

不要把以下内容混进交易表格：

```text
入金
出金
股息
代扣税
利息
手续费现金流
其它现金调整
```

这些内容后续会在 Cash Flows 页面展示。

### 12.4 已实现盈亏优先使用 IBKR realizedPnl

如果交易记录中有 realizedPnl 字段：

```text
realizedPnl = sum(trades.realizedPnl)
```

不要重新用 FIFO 覆盖。

FIFO 只作为没有 realizedPnl 字段时的备用方案。

### 12.5 重复交易处理

如果数据库中可能存在重复交易，需要在 service 层做防御性去重。

优先使用唯一字段：

```text
transactionId
tradeId
orderId
executionId
```

如果没有唯一字段，使用组合 key：

```text
accountId
date
symbol
side
quantity
price
amount
commission
currency
```

如果发现疑似重复数据，返回 warning。

---

## 13. UI 风格要求

整体风格保持与 Overview / Holdings 一致：

```text
白底卡片
圆角
轻阴影
清晰留白
金融数据面板风格
中英文混排但不拥挤
```

表格风格：

```text
表头轻量
行高适中
金额右对齐
数量右对齐
股票代码突出显示
BUY / SELL 使用轻量 badge
盈利绿色
亏损红色
```

不要重新设计整个系统，只新增 Transactions 页面并保持一致风格。

---

## 14. 状态处理

页面需要处理：

```text
loading
error
empty
warnings
```

### 14.1 Loading

展示骨架屏或 loading 状态。

### 14.2 Error

接口失败时展示错误提示，并允许重试。

### 14.3 Empty

没有交易数据时显示：

```text
暂无交易记录，请先导入交易数据
```

### 14.4 Warnings

如果出现：

```text
疑似重复交易
字段缺失
realizedPnl 缺失
交易方向无法识别
```

需要在页面用轻提示展示，不要导致页面崩溃。

---

## 15. Export CSV

如果当前页面已有导出模式，可以支持导出当前筛选后的交易表格。

导出字段：

```text
date
symbol
name
side
quantity
price
amount
commission
realizedPnl
currency
source
```

如果时间不够，本阶段可以先不做导出，但建议保留按钮位置。

---

## 16. 本阶段不做的事情

本阶段暂时不需要做：

```text
1. 现金流水页
2. 股息页
3. 单股详情完整页面
4. 严格 FIFO realizedPnl 重算
5. 税务报表
6. 多账户合并
7. 多币种完整汇率换算
8. 重写首页或持仓页
```

---

## 17. 验收标准

完成后需要满足：

```text
1. 新增 Transactions / 交易明细页面
2. 页面数据来自数据库，不是 mock 数据
3. 不重新读取 CSV 文件
4. 能展示所有 BUY / SELL 股票交易
5. 顶部概览卡片统计正确
6. 支持 symbol / name 搜索
7. 支持 BUY / SELL 筛选
8. 支持按日期、金额、realizedPnl 排序
9. realizedPnl 优先使用数据库中的 IBKR realizedPnl 字段
10. 点击交易行可以查看详情
11. loading / error / empty / warnings 状态完整
12. UI 风格与 Overview / Holdings 保持一致
13. 不影响已有首页和持仓页功能
```