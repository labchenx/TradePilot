# Current Stage：Holdings / 当前持仓页数据接入与 UI 对齐

## 1. 当前阶段目标

当前 Positions / Holdings 页面 UI 已经基本生成，但页面内容与项目真实数据结构和首页指标口径还不完全匹配。

本阶段目标是：**在保留当前 UI 结构的基础上，修正页面文案、数据来源、指标口径和交互逻辑，让当前持仓页真正接入数据库中的持仓数据。**

重点不是重新设计 UI，而是让现有页面从 mock 数据切换为真实数据，并保证和首页 Overview 的数据一致。

---

## 2. 当前 UI 结构

当前页面结构如下：

1. 顶部标题区
   - 页面顶部导航标题：`Holdings / 当前持仓`
   - 页面主标题：`Positions 当前持仓`
   - 副标题：`Review current portfolio holdings, cost basis, and unrealized profits`

2. 顶部统计卡片
   - `Number of Holdings 持仓数`
   - `Total Market Value 总市值`
   - `Total Cost 总成本`
   - `Unrealized P/L 未实现盈亏`

3. 中部图表区域
   - 左侧：`Allocation 持仓占比` 环形图
   - 右侧：`P/L by Symbol 个股盈亏` 柱状图

4. 底部表格区域
   - 标题：`Holdings Detail`
   - 操作：`Export CSV`
   - 表格字段：
     - `SYMBOL / NAME`
     - `SHARES`
     - `AVG COST`
     - `MKT PRICE`
     - `TOTAL COST`
     - `MKT VALUE`
     - `UNREALIZED P/L`
     - `% OF PORT`
     - `ACTION`

以上 UI 结构可以保留，不需要大幅重写。

---

## 3. 本阶段核心要求

### 3.1 不要重写页面 UI

请基于当前页面继续修改：

- 保留当前布局
- 保留顶部卡片 + 图表 + 表格结构
- 保留左侧导航结构
- 保留当前整体视觉风格
- 不要重新生成一套完全不同的页面

本阶段主要做：

- 修正字段命名
- 修正数据口径
- 接入真实 API / service
- 移除 mock 数据
- 增加 loading / error / empty / warning 状态
- 让指标和首页 Overview 保持一致

---

## 4. 数据来源说明

CSV 交易记录已经完成入库。

当前页面不要重新读取 CSV 文件，也不要直接读取 IBKR CSV 中的期末汇总结果。

页面数据应该来自数据库中的：

- trades / transactions：交易记录
- cash flows：现金流水
- corporate actions：拆股、送股、股票奖励、转入转出等
- quotes / market data：当前行情价格
- portfolio / position service：已经封装好的资产和持仓计算逻辑

如果已有 positions service 或 portfolio service，请优先复用。

如果没有，请新增：

```text
GET /api/portfolio/positions
```

页面只调用 API 或 hook，不要在 React 页面组件中写复杂计算逻辑。

---

## 5. 页面指标口径

### 5.1 Number of Holdings 持仓数

当前持仓数只统计仍然持有的股票。

```text
numberOfHoldings = count(position.quantity > 0)
```

注意：

- 已清仓股票不计入当前持仓数
- 后续可以增加已清仓筛选，本阶段不用做

---

### 5.2 Total Market Value 总市值

```text
totalMarketValue = sum(position.marketValue)
```

其中：

```text
position.marketValue = position.quantity * position.marketPrice
```

注意：

- marketPrice 来自 quote service 或行情缓存
- 如果某只股票缺少行情，该股票 marketValue 显示 `--`
- 如果存在缺失行情，summary 中的 totalMarketValue 可以只统计有行情的部分，并返回 warnings；也可以返回 null，按项目现有逻辑统一处理
- 页面不能因为行情缺失崩溃

---

### 5.3 Total Cost 总成本

```text
totalCost = sum(position.costBasis)
```

其中 costBasis 需要来自经过交易和公司行动调整后的当前持仓成本。

注意：

- 买入会形成成本
- 部分卖出后，只保留剩余持仓对应成本
- 拆股不改变总成本，只改变数量和单位成本
- 股票奖励 / 送股如果没有成本基础，可以按 0 成本处理，并返回 warning

---

### 5.4 Unrealized P/L 未实现盈亏

```text
unrealizedPnl = totalMarketValue - totalCost
```

收益率：

```text
unrealizedReturnRate = unrealizedPnl / totalCost
```

注意：

- totalCost 为 0 时，unrealizedReturnRate 返回 null，页面显示 `--`
- 盈利为绿色
- 亏损为红色
- 百分比保留 2 位小数

---

## 6. Allocation 持仓占比图

当前左侧环形图可以保留。

数据来源：

```text
allocation = positions.map(position => ({
  symbol,
  marketValue,
  weight: marketValue / totalMarketValue
}))
```

要求：

- 只展示 quantity > 0 的持仓
- 默认按 marketValue 从高到低排序
- 如果持仓数量较多，可以展示前 5 或前 6，其余合并为 `Others`
- 环形图中间展示总市值，例如 `$25.9k`
- 图例可在后续阶段补充，本阶段可保持当前简洁样式

---

## 7. P/L by Symbol 个股盈亏图

当前右侧柱状图可以保留，但需要接入真实数据。

数据来源：

```text
pnlBySymbol = positions.map(position => ({
  symbol,
  unrealizedPnl
}))
```

要求：

- 默认展示当前持仓的未实现盈亏
- 盈利柱为绿色
- 亏损柱为红色
- 按 unrealizedPnl 从高到低排序，或者按绝对值从高到低排序
- 如果持仓较多，可以展示前 8 或前 10
- 图表标题保持：`P/L by Symbol 个股盈亏`

注意：

当前图表不要展示 mock 的 AMD / NVDA / AAPL 等假数据，必须来自真实 positions API。

---

## 8. Holdings Detail 表格

当前表格结构基本合适，可以保留。

### 8.1 表格字段映射

| UI 字段        | 数据字段                             | 计算口径                       |
| -------------- | ------------------------------------ | ------------------------------ |
| SYMBOL / NAME  | symbol / name                        | 股票代码和名称                 |
| SHARES         | quantity                             | 当前持仓数量                   |
| AVG COST       | avgCost                              | costBasis / quantity           |
| MKT PRICE      | marketPrice                          | 当前行情价格                   |
| TOTAL COST     | costBasis                            | 当前剩余持仓成本               |
| MKT VALUE      | marketValue                          | quantity × marketPrice         |
| UNREALIZED P/L | unrealizedPnl / unrealizedReturnRate | marketValue - costBasis        |
| % OF PORT      | weight                               | marketValue / totalMarketValue |
| ACTION         | view detail                          | 查看详情操作                   |

### 8.2 表格显示规则

- 金额右对齐
- 数量右对齐
- 百分比右对齐
- 股票代码加粗
- 股票名称使用较浅灰色
- 盈利用绿色
- 亏损用红色
- 缺失数据展示 `--`
- 默认按 MKT VALUE 从高到低排序

### 8.3 当前阶段建议保留的操作

ACTION 可以先实现一个简单按钮：

```text
View
```

点击后可以：

- 打开简单详情弹窗 / drawer
- 或者暂时预留跳转 `/positions/[symbol]`

如果时间不够，本阶段可以只保留按钮但不实现复杂详情页。

---

## 9. 需要新增的交互

### 9.1 搜索

建议在 Holdings Detail 标题区域增加搜索框。

支持搜索：

```text
symbol
name
```

示例：

```text
MSFT
NVDA
Microsoft
```

如果当前 UI 暂时没有搜索框，可以在 Export CSV 左侧增加一个轻量搜索框。

### 9.2 排序

至少支持以下字段排序：

```text
marketValue
unrealizedPnl
unrealizedReturnRate
weight
symbol
quantity
```

默认排序：

```text
marketValue desc
```

### 9.3 Export CSV

当前已有 `Export CSV` 按钮，可以保留。

导出字段建议和当前表格一致：

```text
symbol,name,quantity,avgCost,marketPrice,costBasis,marketValue,unrealizedPnl,unrealizedReturnRate,weight,currency
```

---

## 10. 当前持仓计算逻辑

持仓数量不能只用简单买入减卖出，还需要处理公司行动。

```text
quantity =
  累计买入数量
  - 累计卖出数量
  + 股票转入
  - 股票转出
  + 股票奖励
  + 股票股息
  + 拆股/合股调整
```

### 10.1 拆股 / 合股

拆股不改变总成本，只调整数量和单位成本。

```text
新数量 = 原数量 × splitRatio
总成本不变
新单位成本 = 总成本 / 新数量
```

### 10.2 股票奖励 / 送股 / 转入

形成新的 lot。

```text
quantity = 获得数量
costBasis = IBKR 提供的 cost basis，如果没有则为 0
unitCost = costBasis / quantity
```

如果缺少成本基础，需要返回 warning。

---

## 11. 成本计算与 lot 机制

为了正确计算当前持仓成本，建议使用 adjusted lots。

规则：

```text
BUY 生成 lot
STOCK_GRANT / STOCK_DIVIDEND / TRANSFER_IN 生成 lot
SELL 按 FIFO 或 IBKR 成本基础扣减 lot
SPLIT / REVERSE_SPLIT 调整未平仓 lot 的 quantity 和 unitCost，costBasis 不变
```

当前持仓成本：

```text
position.costBasis = sum(remainingLot.costBasis)
```

平均成本：

```text
position.avgCost = position.costBasis / position.quantity
```

---

## 12. 已实现盈亏说明

当前 Holdings 页面主要展示未实现盈亏。

如果页面后续需要展示 realizedPnl，请优先使用数据库中从 IBKR 解析出的 `realizedPnl` 字段：

```text
realizedPnl = sum(trades.realizedPnl grouped by symbol)
```

不要默认使用自写 FIFO 覆盖 IBKR realizedPnl。

本阶段当前 UI 里暂时没有 realizedPnl 表格列，可以不强制展示。

---

## 13. API 返回结构建议

如果还没有统一接口，建议新增：

```text
GET /api/portfolio/positions
```

返回：

```ts
export interface HoldingsSummary {
  numberOfHoldings: number;
  totalMarketValue: number | null;
  totalCost: number;
  unrealizedPnl: number | null;
  unrealizedReturnRate: number | null;
  warnings: string[];
}

export interface HoldingItem {
  symbol: string;
  name?: string;
  quantity: number;
  avgCost: number | null;
  marketPrice?: number;
  costBasis: number;
  marketValue?: number;
  unrealizedPnl?: number;
  unrealizedReturnRate?: number;
  weight?: number;
  currency: string;
  warnings?: string[];
}

export interface HoldingsResponse {
  summary: HoldingsSummary;
  holdings: HoldingItem[];
  allocation: Array<{
    symbol: string;
    marketValue: number;
    weight: number;
  }>;
  pnlBySymbol: Array<{
    symbol: string;
    unrealizedPnl: number;
  }>;
  updatedAt?: string;
}
```

---

## 14. 页面状态

页面需要支持：

1. loading
2. error
3. empty
4. warnings
5. partial data

### 14.1 Empty 状态

当没有当前持仓时，显示：

```text
暂无当前持仓
导入交易记录后，这里会展示你的股票持仓、市值和盈亏。
```

### 14.2 Warning 状态

常见 warnings：

```text
Missing quote for BRK B
Unrecognized corporate action: ...
Missing cost basis for stock grant: ...
```

warnings 可以在页面顶部或表格上方轻提示显示，不要阻断页面。

---

## 15. 与首页 Overview 的一致性校验

本页面计算结果需要能和首页对齐。

要求：

```text
Holdings totalMarketValue = Overview stockMarketValue
```

如果 Overview 中也展示 unrealizedPnl，则：

```text
Holdings unrealizedPnl = Overview unrealizedPnl
```

如果存在差异，请检查：

- 是否使用同一个 quote service
- 是否使用同一个 position calculator
- 是否有 mock 数据未移除
- 是否有 symbol 映射不一致
- 是否有 corporate actions 未处理

---

## 16. 本阶段不做的事情

本阶段暂时不需要：

- 完整股票详情页
- 已清仓股票列表
- 行业分布
- 严格 TWR / MWR
- 多账户合并
- 多币种完整换算
- 复杂税务分析
- 重写首页 UI
- 重做左侧导航

---

## 17. 验收标准

完成后需要满足：

1. 页面不再显示 mock holdings 数据
2. 顶部四张卡片来自真实 positions API
3. Allocation 图来自真实持仓市值占比
4. P/L by Symbol 图来自真实未实现盈亏
5. Holdings Detail 表格来自真实持仓数据
6. 总市值与首页 Overview 股票市值保持一致
7. 持仓成本正确处理部分卖出、拆股、股票奖励等情况
8. 缺少行情时页面不崩溃
9. 支持搜索和基础排序
10. Export CSV 可以导出当前表格数据
11. 复杂计算逻辑不写在 React 页面组件中
12. UI 风格保持当前页面，不重新设计整页
