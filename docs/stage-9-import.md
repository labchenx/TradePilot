# Current Stage：IBKR CSV 导入页开发

## 1. 当前阶段目标

本阶段目标是开发 /imports 数据导入页，用于支持用户上传一个或多个 IBKR CSV 文件，系统解析文件内容，生成导入预览，用户确认后再去重入库。

本阶段不是做通用 Data Quality 页面，也不是只做导入历史展示。核心是完成完整的 CSV 导入闭环：

```text
上传 IBKR CSV 文件
↓
解析 CSV 文件
↓
生成预览表格
↓
检查重复记录
↓
用户确认导入
↓
新增或增量更新数据库
↓
生成导入结果
```

同时需要支持用户手动清空自己的全部投资数据，然后重新导入。

---

## 2. 当前项目背景

当前项目已经完成：

- Overview 首页
- Holdings 当前持仓
- Transactions 交易明细
- Cash Flows 现金流水
- Analytics / Performance 收益分析页
- Trading Behavior 交易行为分析页

这些页面都依赖数据库中的交易、现金流水、公司行动、行情和快照数据。

因此本阶段重点是让用户可以稳定、可重复、可校验地把 IBKR CSV 数据导入系统。

---

## 3. 页面路由与名称

建议页面路由：

```text
/imports
```

页面名称：

```text
Data Import
数据导入
```

导航名称：

```text
导入
```

---

## 4. 核心功能范围

本阶段需要实现：

1. 支持上传一个或多个 IBKR CSV 文件
2. 支持解析上传的 CSV 文件
3. 支持生成导入预览表格
4. 支持识别交易记录、现金流水、公司行动等类型
5. 支持重复记录检测
6. 支持用户确认导入
7. 支持新增数据入库
8. 支持已有重复记录跳过或增量更新
9. 支持展示导入结果
10. 支持用户手动清空自己的数据
11. 支持清空后重新导入

本阶段不做：

- Gmail 自动读取
- IBKR Flex Query 自动同步
- AI 新闻总结
- 自动修复异常数据
- 多账户复杂权限
- 税务计算

---

## 5. 页面结构建议

### 5.1 顶部说明区域

展示简单说明：

```text
上传 IBKR Activity Statement CSV 文件，系统会解析交易记录、现金流水和公司行动。
支持一次上传多个 CSV 文件，系统会自动识别重复记录，确认后导入数据库。
```

可以增加提示：

```text
如果多份 CSV 日期区间有重叠，重复记录会被自动跳过或更新。
```

---

### 5.2 文件上传区域

支持：

```text
单文件上传
多文件上传
拖拽上传
.csv 文件类型校验
```

展示上传文件列表：

```text
文件名
文件大小
上传状态
解析状态
记录数量
错误信息
```

要求：

- 只能上传 CSV
- 可以一次选择多个文件
- 允许用户移除某个待导入文件
- 文件未解析成功时不能进入确认导入

---

### 5.3 解析预览区域

用户上传文件后，点击：

```text
解析预览 Parse Preview
```

系统解析文件并展示预览结果。

预览结果需要按类型分类：

```text
交易记录 Trades
现金流水 Cash Flows
公司行动 Corporate Actions
行情/持仓快照相关记录（如果已支持）
无法识别记录 Unrecognized
```

每类都需要展示数量统计：

```text
总解析数量
新增数量
重复数量
可更新数量
失败数量
```

---

### 5.4 预览表格

预览表格需要展示解析后的标准化记录。

#### 交易记录预览字段

```text
Status 状态：NEW / DUPLICATE / UPDATE / ERROR
Date 日期
Symbol 股票代码
Side 买入/卖出
Quantity 数量
Price 成交价
Amount 金额
Commission 佣金
Realized P/L 已实现盈亏
Currency 币种
Source Hash
Error 错误信息
```

#### 现金流水预览字段

```text
Status 状态：NEW / DUPLICATE / UPDATE / ERROR
Date 日期
Type 类型
Amount 金额
Currency 币种
Description 描述
Source Hash
Error 错误信息
```

#### 公司行动预览字段

```text
Status 状态：NEW / DUPLICATE / UPDATE / ERROR
Date 日期
Symbol 股票代码
Action Type 公司行动类型
Quantity 数量变化
Ratio 拆股比例
Amount 金额
Description 描述
Source Hash
Error 错误信息
```

如果 UI 空间有限，可以先用一个统一表格，通过 recordType 区分不同类型。

---

## 6. 导入确认流程

用户确认前，页面需要清楚展示：

```text
将新增多少条记录
将跳过多少条重复记录
将更新多少条已有记录
有多少条错误记录不会导入
```

确认按钮：

```text
确认导入 Confirm Import
```

确认导入后：

1. 创建 ImportJob
2. 写入 ImportRecord
3. 对 NEW 记录写入数据库
4. 对 DUPLICATE 记录跳过
5. 对 UPDATE 记录进行增量更新
6. 对 ERROR 记录不入库，记录错误原因
7. 返回导入结果

导入完成后展示结果：

```text
导入成功
新增记录数
重复跳过数
更新记录数
失败记录数
```

---

## 7. 去重与增量更新规则

### 7.1 sourceHash 规则

每条标准化记录都需要生成 sourceHash。

推荐按记录类型生成不同 hash。

#### Trade sourceHash

```text
hash(
  broker +
  accountId +
  tradeDate +
  symbol +
  side +
  quantity +
  price +
  amount +
  commission +
  currency
)
```

如果 IBKR CSV 中有 transactionId / tradeId / executionId，优先加入 hash 或作为唯一字段。

#### CashFlow sourceHash

```text
hash(
  broker +
  accountId +
  flowDate +
  type +
  amount +
  currency +
  description
)
```

#### CorporateAction sourceHash

```text
hash(
  broker +
  accountId +
  actionDate +
  symbol +
  actionType +
  quantity +
  ratio +
  amount +
  description
)
```

### 7.2 重复记录

如果 sourceHash 已存在：

```text
status = DUPLICATE
```

默认跳过，不重复入库。

### 7.3 增量更新

如果系统能识别为同一条业务记录，但新解析数据补充了更多字段，可以标记为：

```text
status = UPDATE
```

适合场景：

```text
之前记录缺少 realizedPnl，新记录有 realizedPnl
之前记录缺少 commission，新记录有 commission
之前记录 rawData 不完整，新记录更完整
```

更新规则：

- 不要覆盖用户手动修改的重要字段，除非当前字段为空
- 优先补全空字段
- rawData 可以追加或覆盖为更完整版本
- updatedAt 需要更新
- ImportRecord 中记录 update 行为

如果当前项目不方便实现复杂更新，可以第一版先：

```text
DUPLICATE 直接跳过
NEW 正常入库
ERROR 不入库
```

但代码结构要预留 UPDATE 状态。

---

## 8. 清空数据与重新导入

页面需要提供手动清空数据功能。

按钮建议：

```text
清空我的数据 Clear My Data
```

这是高风险操作，必须增加确认流程。

确认文案建议：

```text
此操作会清空当前用户的交易记录、现金流水、公司行动、持仓快照、月度快照和导入日志。清空后可以重新导入 CSV 文件。此操作不可恢复。
```

要求用户二次确认，例如输入：

```text
CLEAR
```

才允许执行。

### 8.1 清空范围

清空当前用户相关数据，包括但不限于：

```text
trades / transactions
cash_flows
corporate_actions
import_jobs
import_records
portfolio_monthly_snapshots
position_monthly_snapshots
price_history 中用户相关或派生数据
```

注意：

- 如果 price_history 是公共行情缓存，不要清空全局行情价格
- 如果 price_history 绑定 userId/accountId，则可以清空当前用户相关价格记录
- 必须只清空当前用户数据，不要影响其他用户

### 8.2 清空接口

建议新增：

```text
DELETE /api/portfolio/data
```

或：

```text
POST /api/portfolio/clear-data
```

返回：

```ts
{
  success: true,
  deletedCounts: {
    trades: number;
    cashFlows: number;
    corporateActions: number;
    importJobs: number;
    importRecords: number;
    portfolioMonthlySnapshots: number;
    positionMonthlySnapshots: number;
  }
}
```

清空后：

- 前端刷新页面状态
- 所有统计归零
- 允许用户重新上传 CSV 导入

---

## 9. API 设计建议

### 9.1 上传并解析预览

```text
POST /api/imports/ibkr-csv/preview
```

请求：

```text
multipart/form-data
files: File[]
```

返回：

```ts
export interface ImportPreviewResponse {
  jobPreviewId?: string;
  files: ImportPreviewFile[];
  summary: ImportPreviewSummary;
  records: ImportPreviewRecord[];
  warnings: string[];
}

export interface ImportPreviewFile {
  fileName: string;
  fileSize: number;
  status: 'PARSED' | 'FAILED';
  totalRows: number;
  parsedRows: number;
  errorRows: number;
  errorMessage?: string;
}

export interface ImportPreviewSummary {
  totalRecords: number;
  newRecords: number;
  duplicateRecords: number;
  updateRecords: number;
  errorRecords: number;
  tradeRecords: number;
  cashFlowRecords: number;
  corporateActionRecords: number;
  unrecognizedRecords: number;
}

export interface ImportPreviewRecord {
  tempId: string;
  recordType: 'TRADE' | 'CASH_FLOW' | 'CORPORATE_ACTION' | 'UNRECOGNIZED';
  status: 'NEW' | 'DUPLICATE' | 'UPDATE' | 'ERROR';
  sourceHash?: string;
  data: unknown;
  rawData?: unknown;
  errorMessage?: string;
}
```

### 9.2 确认导入

```text
POST /api/imports/ibkr-csv/confirm
```

请求：

```ts
{
  jobPreviewId?: string;
  records: ImportPreviewRecord[];
}
```

返回：

```ts
export interface ImportConfirmResponse {
  importJobId: string;
  summary: {
    totalRecords: number;
    insertedRecords: number;
    duplicateRecords: number;
    updatedRecords: number;
    failedRecords: number;
  };
  records: ImportConfirmRecord[];
  warnings: string[];
}
```

### 9.3 导入历史

```text
GET /api/imports/history
```

### 9.4 导入详情

```text
GET /api/imports/:id
```

### 9.5 清空数据

```text
POST /api/portfolio/clear-data
```

---

## 10. 数据库建议

如果已有相关表，优先复用。

建议表：

```text
ImportJob
ImportRecord
```

### ImportJob

```text
id
source              IBKR_CSV
status              PENDING / PREVIEWED / SUCCESS / FAILED / PARTIAL
fileNames           string[] 或 JSON
startedAt
finishedAt
totalCount
successCount
duplicateCount
updateCount
failedCount
errorMessage
createdAt
updatedAt
```

### ImportRecord

```text
id
importJobId
recordType          TRADE / CASH_FLOW / CORPORATE_ACTION / UNRECOGNIZED
sourceHash
status              SUCCESS / DUPLICATE / UPDATED / FAILED
rawData
normalizedData
errorMessage
createdAt
```

业务表至少包括：

```text
trades / transactions
cash_flows
corporate_actions
```

---

## 11. CSV 解析要求

解析器需要适配 IBKR Activity Statement CSV。

建议拆分为独立 service：

```text
services/imports/
  ibkr-csv-parser.ts
  ibkr-csv-normalizer.ts
  import-dedup-service.ts
  import-confirm-service.ts
```

解析流程：

```text
读取 CSV
识别 section
按 section 解析 rows
标准化为 Trade / CashFlow / CorporateAction
生成 sourceHash
检查数据库是否已有
生成 preview records
```

需要注意 IBKR CSV 可能包含：

```text
Trades
Deposits & Withdrawals
Dividends
Withholding Tax
Interest
Fees
Corporate Actions
Open Positions
Net Asset Value
```

本阶段应重点解析：

```text
Trades
Deposits & Withdrawals
Corporate Actions
Dividends / Tax / Interest / Fees 如果当前数据库支持
```

不要直接导入：

```text
Net Asset Value 期末汇总
Open Positions 期末持仓汇总
```

这些可以作为校验参考，但不要作为核心数据来源。

---

## 12. 前端状态处理

页面需要支持：

```text
idle
uploading
parsing
previewReady
confirming
success
error
```

状态说明：

- idle：等待上传
- uploading：上传文件中
- parsing：解析中
- previewReady：预览可确认
- confirming：确认导入中
- success：导入完成
- error：解析或导入失败

---

## 13. UI 风格要求

整体风格保持与已完成页面一致：

```text
白底卡片
圆角
轻阴影
金融数据面板风格
中英文混排但不拥挤
表格信息清晰
状态标签明确
```

状态颜色建议：

```text
NEW: 蓝色 / 绿色
DUPLICATE: 灰色
UPDATE: 黄色 / 橙色
ERROR: 红色
SUCCESS: 绿色
FAILED: 红色
PARTIAL: 黄色 / 橙色
```

---

## 14. 安全与容错要求

### 14.1 上传限制

- 只允许 CSV 文件
- 限制单个文件大小
- 限制一次上传文件数量
- 解析失败时显示错误信息

### 14.2 数据安全

- 清空数据只能清空当前用户数据
- 清空操作必须二次确认
- 导入确认前不写入业务表
- 解析失败记录不能入库
- 重复导入不能造成重复数据

### 14.3 容错

- 单个文件失败不影响其它文件预览
- 单条记录失败不影响其它记录导入
- 部分成功时 ImportJob 状态为 PARTIAL
- 所有失败时状态为 FAILED
- 全部成功时状态为 SUCCESS

---

## 15. 验收标准

完成后需要满足：

1. /imports 页面支持上传一个或多个 IBKR CSV 文件
2. 只允许 CSV 文件上传
3. 能解析 CSV 并生成预览表格
4. 预览表格能区分 TRADE / CASH_FLOW / CORPORATE_ACTION / UNRECOGNIZED
5. 预览表格能显示 NEW / DUPLICATE / UPDATE / ERROR 状态
6. 用户确认导入前，不写入业务表
7. 用户确认导入后，NEW 记录入库
8. 重复记录不会重复入库
9. 支持增量导入，多份重叠区间 CSV 不会造成重复数据
10. 如果支持 UPDATE，能补全已有记录缺失字段
11. 能生成 ImportJob 和 ImportRecord
12. 能查看导入历史和导入详情
13. 支持手动清空当前用户数据
14. 清空数据必须二次确认
15. 清空后可以重新上传 CSV 导入
16. 不导入 IBKR 的 Net Asset Value 和 Open Positions 汇总作为核心数据
17. UI 风格与现有页面保持一致
18. 不影响 Overview / Holdings / Transactions / Cash Flows / Analytics / Trading Behavior 页面