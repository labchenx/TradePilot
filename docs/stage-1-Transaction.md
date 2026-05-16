# Current Stage - IBKR CSV Import & Transaction Ingestion

## 1. 当前阶段目标

当前阶段暂停前端页面接口开发，也不继续优化 UI。

本阶段的核心目标是：

> 基于 `examples/ibkr/` 目录下的两个真实 IBKR CSV 文件，实现交易流水解析、标准化、预览和入库。

当前项目已经有两个 IBKR Transaction History CSV 样例文件，已放置在：

```txt
examples/ibkr/
```

这两个文件不是普通的“第一行就是表头”的 CSV，而是 IBKR 导出的多 section 结构文件。

本阶段需要优先完成：

```txt
IBKR CSV
  ↓
识别 Transaction History section
  ↓
解析 Header / Data 行
  ↓
转换成标准 transaction event
  ↓
保存原始行 rawData
  ↓
生成 preview
  ↓
确认后入库
  ↓
通过查询接口 / 测试验证入库结果
```

---

## 2. 当前已有输入

项目中已经有两个 CSV 文件：

```txt
examples/ibkr/20240819-20251231(2).csv
examples/ibkr/20260101-20260506(2).csv
```

这两个文件代表了用户从 2024 年下半年到 2026 年 5 月左右的 IBKR 交易历史。

请优先基于这两个真实样例实现 parser，不要一开始追求兼容所有 IBKR 格式。

---

## 3. CSV 结构说明

这两个 CSV 的主要结构类似：

```csv
Statement,Header,...
Statement,Data,...

总结,Header,...
总结,Data,...

Transaction History,Header,日期,账户,说明,交易类型,代码,数量,价格,Price Currency,总额,佣金,净额
Transaction History,Data,...
Transaction History,Data,...
```

真正需要解析的是：

```txt
Transaction History,Header
Transaction History,Data
```

注意：

- 不要假设第一行是表头
- 不要使用 `header: true` 直接解析整个文件
- 应该逐行读取 CSV
- 根据 section 判断当前行属于哪里
- 找到 `Transaction History,Header` 后保存 header
- 使用该 header 解析后续 `Transaction History,Data` 行

---

## 4. 本阶段需要抽取的原始字段

从 `Transaction History` section 中抽取以下字段：

| 原始字段         | 中文含义 | 说明                                   |
| ---------------- | -------- | -------------------------------------- |
| `日期`           | 日期     | 交易或现金流水发生日期                 |
| `账户`           | 账户     | IBKR 账户号，建议脱敏展示              |
| `说明`           | 说明     | IBKR 原始说明文本                      |
| `交易类型`       | 交易类型 | 买、卖、存款、取款、股息、外国预扣税等 |
| `代码`           | 标的代码 | 股票代码或相关标的                     |
| `数量`           | 数量     | 买入通常为正，卖出通常为负             |
| `价格`           | 成交价格 | 股票成交价格，现金流水可能为空         |
| `Price Currency` | 价格货币 | 通常为 USD                             |
| `总额`           | 总额     | 不含佣金的原始金额                     |
| `佣金`           | 佣金     | 交易佣金或费用                         |
| `净额`           | 净额     | 实际现金影响金额                       |

---

## 5. 标准化字段设计

请将原始行转换成统一的 `TransactionEvent` 模型。

建议类型如下：

```ts
export type IbkrEventType =
  | "TRADE_BUY"
  | "TRADE_SELL"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "DIVIDEND"
  | "PAYMENT_IN_LIEU"
  | "WITHHOLDING_TAX"
  | "DEBIT_INTEREST"
  | "OTHER_FEE"
  | "FX_COMPONENT"
  | "ADJUSTMENT"
  | "UNKNOWN";

export interface TransactionEvent {
  id?: string;

  // 导入信息
  importFileId?: string;
  source: "IBKR_CSV";
  sourceFileName?: string;
  sourceSection: "Transaction History";
  rawRowIndex: number;
  rawData: Record<string, string>;

  // 原始业务字段
  tradeDate: string;
  accountId: string;
  description: string;
  ibkrType: string;

  // 标准化分类
  eventType: IbkrEventType;

  // 标的相关
  symbol?: string;
  quantity?: number;
  absQuantity?: number;
  price?: number;
  currency?: string;

  // 金额相关
  grossAmount: number;
  commission: number;
  netAmount: number;

  // 衍生字段
  side?: "BUY" | "SELL";
  isTrade: boolean;
  isExternalCashFlow: boolean;
  isIncome: boolean;
  isTaxOrFee: boolean;
}
```

---

## 6. 交易类型映射规则

请按以下规则将 IBKR 原始 `交易类型` 映射为系统标准 `eventType`：

| IBKR 交易类型      | eventType         | 中文说明         |
| ------------------ | ----------------- | ---------------- |
| `买`               | `TRADE_BUY`       | 股票买入         |
| `卖`               | `TRADE_SELL`      | 股票卖出         |
| `存款`             | `DEPOSIT`         | 入金             |
| `取款`             | `WITHDRAWAL`      | 出金             |
| `股息`             | `DIVIDEND`        | 股息收入         |
| `替代支付`         | `PAYMENT_IN_LIEU` | 替代股息支付     |
| `外国预扣税`       | `WITHHOLDING_TAX` | 外国预扣税       |
| `借方利息`         | `DEBIT_INTEREST`  | 借款 / 融资利息  |
| `其它费用`         | `OTHER_FEE`       | 其他费用         |
| `外汇交易组成部分` | `FX_COMPONENT`    | 外汇交易组成部分 |
| `调整`             | `ADJUSTMENT`      | 账户调整         |
| 其他未知类型       | `UNKNOWN`         | 未识别类型       |

---

## 7. 衍生字段规则

### 7.1 买卖方向

```txt
交易类型 = 买 → side = BUY
交易类型 = 卖 → side = SELL
```

也可以用数量辅助校验：

```txt
quantity > 0 → BUY
quantity < 0 → SELL
```

但优先以 `交易类型` 为准。

### 7.2 是否交易

```txt
TRADE_BUY / TRADE_SELL → isTrade = true
其他 → isTrade = false
```

### 7.3 是否外部现金流

```txt
DEPOSIT / WITHDRAWAL → isExternalCashFlow = true
其他 → isExternalCashFlow = false
```

### 7.4 是否投资收入

```txt
DIVIDEND / PAYMENT_IN_LIEU → isIncome = true
其他 → isIncome = false
```

### 7.5 是否税费

```txt
WITHHOLDING_TAX / DEBIT_INTEREST / OTHER_FEE → isTaxOrFee = true
其他 → isTaxOrFee = false
```

### 7.6 金额字段

请保留 IBKR 原始符号：

- 买入通常 `grossAmount` 为负数
- 卖出通常 `grossAmount` 为正数
- 佣金通常为负数
- 入金通常为正数
- 出金通常为负数
- 税费通常为负数

不要在入库阶段强行改成绝对值。

如需展示绝对值，后续可以在前端或 service 层处理。

---

## 8. 本阶段需要实现的能力

### 8.1 Parser Detector

实现 `parserDetector`，用于判断文件是否为当前支持的 IBKR Transaction History CSV。

判断依据可以包括：

- 文件中存在 `Transaction History,Header`
- Header 中包含 `日期`
- Header 中包含 `交易类型`
- Header 中包含 `净额`

### 8.2 IBKR CSV Parser

实现 `ibkrCsvParser`：

要求：

- 按行读取 CSV
- 正确处理逗号、引号、空字段
- 不假设第一行是表头
- 识别 `Transaction History` section
- 保存 `Transaction History,Header`
- 解析所有 `Transaction History,Data`
- 生成 `TransactionEvent[]`
- 保留 `rawRowIndex`
- 保留 `rawData`
- 对无法解析的行生成 warning 或 error，不要静默丢弃

### 8.3 Preview

实现导入预览能力：

```txt
POST /imports/preview
```

返回内容建议包括：

```ts
{
  importFileId: string;
  source: 'IBKR_CSV';
  filename: string;
  parsedEvents: TransactionEvent[];
  summary: {
    totalRows: number;
    parsedRows: number;
    tradeRows: number;
    cashFlowRows: number;
    warningCount: number;
    errorCount: number;
    depositTotal: number;
    withdrawalTotal: number;
    netDeposit: number;
    dividendTotal: number;
    taxAndFeeTotal: number;
    tradeBuyTotal: number;
    tradeSellTotal: number;
    commissionTotal: number;
  };
  warnings: string[];
  errors: string[];
}
```

### 8.4 Confirm

实现确认入库能力：

```txt
POST /imports/confirm
```

要求：

- 根据 `importFileId` 确认导入
- 写入标准化 `transaction_events`
- 保存原始 `rawData`
- 更新导入文件状态为 `CONFIRMED`
- 避免重复 confirm
- 避免同一文件重复导入

### 8.5 Query

实现基础查询接口：

```txt
GET /transaction-events
GET /imports/:id
```

用于验证导入结果。

---

## 9. 建议数据库表

### 9.1 import_files

| 字段          | 中文注释                                           |
| ------------- | -------------------------------------------------- |
| `id`          | 导入文件 ID                                        |
| `filename`    | 文件名                                             |
| `source`      | 数据来源，例如 `IBKR_CSV`                          |
| `fileHash`    | 文件哈希，用于防重复                               |
| `periodStart` | 文件统计开始日期                                   |
| `periodEnd`   | 文件统计结束日期                                   |
| `status`      | 导入状态：PENDING / PREVIEWED / CONFIRMED / FAILED |
| `summary`     | 导入摘要 JSON                                      |
| `createdAt`   | 创建时间                                           |
| `confirmedAt` | 确认时间                                           |

### 9.2 transaction_events

| 字段                 | 中文注释          |
| -------------------- | ----------------- |
| `id`                 | 流水 ID           |
| `importFileId`       | 所属导入文件 ID   |
| `source`             | 数据来源          |
| `sourceFileName`     | 来源文件名        |
| `sourceSection`      | 来源 section      |
| `rawRowIndex`        | 原始行号          |
| `rawData`            | 原始行 JSON       |
| `tradeDate`          | 日期              |
| `accountId`          | 账户              |
| `description`        | 说明              |
| `ibkrType`           | IBKR 原始交易类型 |
| `eventType`          | 系统标准事件类型  |
| `symbol`             | 股票代码          |
| `quantity`           | 数量              |
| `absQuantity`        | 绝对数量          |
| `price`              | 成交价格          |
| `currency`           | 货币              |
| `grossAmount`        | 总额              |
| `commission`         | 佣金              |
| `netAmount`          | 净额              |
| `side`               | 买卖方向          |
| `isTrade`            | 是否交易          |
| `isExternalCashFlow` | 是否外部现金流    |
| `isIncome`           | 是否投资收入      |
| `isTaxOrFee`         | 是否税费          |
| `createdAt`          | 创建时间          |

---

## 10. 本阶段可以验证的统计指标

根据这两个 CSV，可以直接统计：

| 指标         | 是否可直接计算 | 说明                                               |
| ------------ | -------------- | -------------------------------------------------- |
| 存款合计     | 可以           | `eventType = DEPOSIT` 的 `netAmount` 求和          |
| 取款合计     | 可以           | `eventType = WITHDRAWAL` 的 `netAmount` 求和       |
| 净入金       | 可以           | 存款 + 取款                                        |
| 买入总额     | 可以           | `TRADE_BUY` 的 `grossAmount` 求和                  |
| 卖出总额     | 可以           | `TRADE_SELL` 的 `grossAmount` 求和                 |
| 佣金合计     | 可以           | `commission` 求和                                  |
| 股息收入     | 可以           | `DIVIDEND` + `PAYMENT_IN_LIEU`                     |
| 税费利息     | 可以           | `WITHHOLDING_TAX` + `DEBIT_INTEREST` + `OTHER_FEE` |
| 当前持仓数量 | 可以推算       | 根据买卖记录按 symbol 汇总 quantity                |
| 当前持仓市值 | 不可以直接得到 | 需要行情价格或持仓报表                             |
| 完整总盈利   | 不可以直接得到 | 需要当前账户总资产或持仓市值                       |
| 已实现盈亏   | 可以后续计算   | 需要确定 FIFO / 平均成本法                         |

本阶段先不要实现完整盈利计算，只需要为后续计算打好数据基础。

---

## 11. 本阶段不做的事情

本阶段不要做：

- 不继续开发前端页面
- 不接真实前端页面接口
- 不实现 Dashboard 页面数据接口
- 不接 AI API
- 不接 IBKR Flex Query
- 不做邮箱自动读取
- 不做复杂收益率计算
- 不做完整 holdings 市值计算
- 不接行情 API
- 不大改前端 UI
- 不重新设计页面

---

## 12. 测试要求

请基于 `examples/ibkr/` 下两个真实 CSV 文件编写测试。

至少验证：

1. 能识别为 IBKR Transaction History CSV
2. 能找到 `Transaction History,Header`
3. 能解析出 `Transaction History,Data`
4. 能正确解析买入记录
5. 能正确解析卖出记录
6. 能正确解析存款记录
7. 能正确解析取款记录
8. 能正确解析股息、税费、利息等现金流水
9. 能正确生成 `eventType`
10. 能正确计算 preview summary
11. Confirm 后可以入库
12. 重复 confirm 会被阻止
13. 重复导入同一文件会被识别

---

## 13. 验证命令

完成后请运行项目已有命令。

优先运行：

```bash
npm install
npm run build
npm run test
```

如果项目中存在以下命令，也请运行：

```bash
npm run lint
npm run typecheck
```

如果命令不存在，不要强行新增复杂配置，请在最终说明中说明。

---

## 14. 交付结果要求

完成后请输出：

1. 新增或修改了哪些文件
2. Parser 的核心逻辑是什么
3. 数据库表结构是什么
4. Preview 接口如何调用
5. Confirm 接口如何调用
6. 测试覆盖了哪些场景
7. 两个 CSV 的解析 summary 结果
8. 是否可以正确计算净入金
9. 哪些盈利指标目前还不能计算
10. 下一阶段建议做什么

---

## 15. 下一阶段预期

本阶段完成后，下一阶段可以进入：

```txt
Stage 2: Holdings & Performance Calculation
```

下一阶段再考虑：

- 根据交易记录计算当前持仓数量
- 根据平均成本法或 FIFO 计算成本
- 计算已实现盈亏
- 接入行情价格或导入持仓报表
- 计算未实现盈亏
- 生成 Dashboard summary API
