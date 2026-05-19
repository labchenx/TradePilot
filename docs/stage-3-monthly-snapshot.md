# Current Stage：资产趋势图历史行情与月末快照优化

## 1. 当前阶段目标

本阶段目标是修复和优化首页「Asset Trend 资产趋势」图表的数据口径。

当前图表暂时使用“现金 + 持仓成本”估算资产趋势，这个口径不能真实反映历史资产变化。接下来需要改成：

```text
每月月末总资产 = 当月月末现金余额 + 当月月末股票市值
```

其中：

```text
当月月末股票市值 = sum(月末持仓数量 × 当月最后一个交易日收盘价)
```

同时，为了避免后期交易数据过多时每次打开首页都全量扫描交易记录，需要设计并实现「月末资产快照」机制。

---

## 2. 背景说明

当前系统已经完成 CSV 交易记录入库。

本阶段不要重新读取 CSV 文件，也不要直接读取 IBKR CSV 中的期末总资产、期末股票市值、期末现金余额等汇总结果。

资产趋势应基于数据库中的：

- 交易记录
- 现金流水
- 公司行动
- 历史行情价格
- 月末快照

来计算。

---

## 3. 本阶段核心任务

### 3.1 接入历史行情数据

需要接入历史行情数据，用于计算每个月月末持仓市值。

第一阶段可以继续使用 `yahoo-finance2`。

注意：

- 不要在 React 页面组件中直接调用行情接口
- 历史行情应在 service 或 API 层获取
- 获取成功后应写入历史价格缓存表
- 前端图表优先读取数据库缓存结果
- Yahoo Finance 是非官方接口，需要做好错误处理和 warnings

建议新增或完善历史价格表：

```ts
price_history {
  id
  symbol
  date
  close
  adjustedClose
  currency
  source
  createdAt
  updatedAt
}
```

建议目录结构：

```text
src/
  services/
    market-data/
      historical-price-service.ts
      yahoo-historical-provider.ts
      symbol-normalizer.ts
```

需要处理 symbol 兼容问题，例如：

```text
BRK B / BRK.B -> BRK-B
```

---

### 3.2 按月末重建历史持仓

资产趋势不能用当前持仓回推历史。

每个月都需要根据当月月末之前的交易记录和公司行动，计算当时真实持仓。

计算规则：

```text
月末持仓数量 =
  截至月末累计买入数量
  - 截至月末累计卖出数量
  + 截至月末公司行动调整
```

注意：

- BUY 增加持仓
- SELL 减少持仓
- 拆股 / 合股需要调整持仓数量
- 股票奖励 / 送股 / 股票转入需要增加持仓
- 公司行动无法识别时返回 warning
- 不要忽略 IBKR 中的 corporate actions

---

### 3.3 月末总资产计算

每个月月末资产计算公式：

```text
monthlyTotalAssets = monthlyCashBalance + monthlyStockMarketValue
```

其中：

```text
monthlyStockMarketValue = sum(monthEndQuantity * monthEndClosePrice)
```

现金余额：

```text
monthlyCashBalance = 截至当月月末的现金流水累计值
```

净入金：

```text
monthlyNetDeposit = 截至当月月末累计 DEPOSIT + WITHDRAWAL
```

总收益：

```text
monthlyTotalReturn = monthlyTotalAssets - monthlyNetDeposit
```

如果某个月缺少历史行情：

- 不要让页面崩溃
- 当前月 totalAssets 可以返回 null
- 页面显示 `--`
- warnings 中说明缺少哪个 symbol、哪个月份的价格

---

## 4. 月末快照机制

为了避免后期交易数据过多时，每次打开首页都重新扫描全部交易记录，本阶段需要引入月末快照设计。

### 4.1 建议新增月末资产快照表

```ts
portfolio_monthly_snapshots {
  id
  accountId
  month
  snapshotDate
  cashBalance
  stockMarketValue
  totalAssets
  netDeposit
  totalReturn
  realizedPnl
  realizedNetIncome
  createdAt
  updatedAt
}
```

### 4.2 建议新增月末持仓快照表

```ts
position_monthly_snapshots {
  id
  accountId
  month
  symbol
  quantity
  costBasis
  marketPrice
  marketValue
  unrealizedPnl
  currency
  createdAt
  updatedAt
}
```

### 4.3 首页读取逻辑

首页资产趋势图不要每次实时全量计算。

优先读取：

```text
portfolio_monthly_snapshots
```

如果快照为空，可以触发生成快照，或者返回空状态提示。

---

## 5. 快照生成逻辑

当前阶段可以先实现「全量生成月末快照」。

后续再扩展为「增量重算」。

### 5.1 全量生成快照流程

```text
1. 从数据库读取交易记录、现金流水、公司行动
2. 根据最早交易日期和当前日期生成月份列表
3. 遍历每个月月末
4. 计算截至该月末的现金余额
5. 计算截至该月末的净入金
6. 计算截至该月末的持仓数量和成本
7. 获取该月最后一个交易日的历史收盘价
8. 计算股票市值
9. 计算总资产和总收益
10. 写入 portfolio_monthly_snapshots
11. 写入 position_monthly_snapshots
```

---

## 6. 后续增量重算预留设计

虽然当前阶段可以先做全量生成，但代码结构需要预留增量更新能力。

后续导入新交易后，应支持：

```text
1. 找到本次导入数据的最早日期
2. 定位到该日期所在月份
3. 从上一个月末快照作为计算起点
4. 只重算受影响月份之后的快照
```

示例：

```text
如果新导入一笔 2025-08-15 的交易：

只需要重算：
2025-08
2025-09
2025-10
...
当前月份

不需要重算 2025-08 之前的快照。
```

建议 service 设计：

```ts
generateMonthlySnapshots(accountId: string): Promise<void>

regenerateSnapshotsFromMonth(
  accountId: string,
  startMonth: string
): Promise<void>
```

---

## 7. API / Service 建议

建议新增或完善 API：

```text
GET /api/portfolio/monthly-trend
```

返回：

```ts
export interface MonthlyAssetPoint {
  month: string;
  date: string;
  totalAssets: number | null;
  stockMarketValue: number | null;
  cashBalance: number;
  netDeposit: number;
  totalReturn: number | null;
  warnings?: string[];
}
```

建议新增 service：

```text
src/
  services/
    portfolio/
      monthly-snapshot-service.ts
      monthly-trend-service.ts
      historical-position-calculator.ts
      historical-cash-calculator.ts
    market-data/
      historical-price-service.ts
      yahoo-historical-provider.ts
      symbol-normalizer.ts
```

---

## 8. 页面展示要求

尽量保持当前 UI 不变，只修改数据来源和说明文案。

当前图表标题可以继续使用：

```text
Asset Trend 资产趋势
```

图例建议改为：

```text
总资产
净入金
```

如果历史行情没有接入成功，或者快照使用的是成本估算口径，则必须显示说明：

```text
当前未接入完整历史行情，暂按持仓成本估算，不代表真实历史市值。
```

接入历史行情并使用月末价格后，说明文案可以改为：

```text
月末总资产 = 月末现金余额 + 月末持仓 × 月末收盘价
```

---

## 9. 容错要求

需要处理以下异常情况：

1. 某只股票缺少历史价格
2. 某个月没有交易日价格
3. Yahoo Finance 请求失败
4. symbol 无法映射
5. 公司行动无法识别
6. 拆股比例无法解析
7. 某个月持仓数量和快照数量不一致
8. 现金流水不完整
9. 历史价格缓存缺失

处理方式：

- 不要让页面崩溃
- 返回 warnings
- 对无法计算的月份返回 null
- 页面显示 `--`
- 可以保留其它可正常计算月份的数据

---

## 10. 本阶段不做的事情

本阶段暂时不需要做：

- 严格 TWR / MWR 收益率
- 多账户合并
- 多币种完整汇率换算
- 复杂税务计算
- 实时分钟级行情
- 逐日资产曲线
- 重写首页 UI

---

## 11. 验收标准

完成后需要满足：

1. 资产趋势图不再使用“现金 + 持仓成本”作为最终资产趋势口径
2. 图表按月展示每月月末总资产
3. 每月持仓必须是当月月末真实持仓，而不是当前持仓回推
4. 股票市值使用历史月末价格计算
5. 历史价格写入缓存表
6. 首页图表优先读取月末快照
7. 快照生成逻辑不写在 React 页面组件中
8. 缺少行情或公司行动异常时不会导致页面崩溃
9. 返回 warnings 方便排查
10. 代码结构预留后续增量重算能力

---

## 12. 给 Codex 的一句话任务

请根据 `current-stage.md` 实现资产趋势图的历史行情接入和月末快照机制，优先保证计算口径正确，UI 尽量保持不变。
