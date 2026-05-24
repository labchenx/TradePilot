# Current Stage：Email PDF 附件解析与确认入库

## 1. 当前阶段目标

当前已经可以通过 QQ / 163 邮箱 IMAP 连接读取邮件，并扫描到 IBKR 交易报告邮件。

本阶段目标是在现有 Email Import 能读取邮件的基础上，继续完成：

```text
默认扫描最近 3 天邮件
读取 IBKR 交易报告 PDF 附件
提取 PDF 文本
规则解析 Daily Trade Report
生成交易预览
sourceHash 去重
用户确认导入
NEW 记录入库
DUPLICATE 记录跳过
ERROR 记录展示原因
```

本阶段重点是打通从 **邮件 PDF 附件 → 交易记录入库** 的完整闭环。

---

## 2. 默认同步范围调整

当前 Email Import 扫描范围需要调整：

```text
默认扫描范围：最近 3 天
```

原因：

```text
后续计划做定时任务每天同步邮件，因此默认只需要扫描最近几天的新邮件。
```

前端扫描范围选项建议调整为：

```text
3 天
7 天
30 天
90 天
```

默认值：

```text
3d
```

后端 `range` 枚举需要支持：

```ts
type EmailScanRange = '3d' | '7d' | '30d' | '90d';
```

如果 Settings Email 配置中已有 `defaultScanRange`，也需要把默认值从 `30d` 改为：

```text
3d
```

---

## 3. 页面位置

继续在 Imports 页面中实现：

```text
Imports / 数据导入
  - CSV Import
  - Email Import
```

本阶段主要完善：

```text
Email Import
```

不要新建独立大页面。

---

## 4. 核心流程

完整流程：

```text
1. 用户进入 Imports / Email Import
2. 默认扫描范围为最近 3 天
3. 点击扫描并解析
4. 后端连接当前用户已配置的邮箱
5. 搜索 IBKR 交易报告邮件
6. 读取 PDF 附件
7. 提取 PDF 文本
8. 规则解析 Trades 表格
9. 生成交易预览
10. 检查 sourceHash 是否重复
11. 页面展示预览表格
12. 用户确认导入
13. NEW 记录写入 trades / transactions
14. DUPLICATE 记录跳过
15. ERROR 记录不入库
16. 写入 ImportJob / ImportRecord / EmailMessageRecord
```

---

## 5. 邮件匹配规则

IBKR 邮件标题示例：

```text
05/21/2026日交易报告
05/22/2026日交易报告
Daily Trade Report
Trade Report
```

建议正则：

```ts
const IBKR_TRADE_SUBJECT_REGEX =
  /(\d{2}\/\d{2}\/\d{4}.*交易报告|Daily Trade Report|Trade Report)/i;
```

发件人匹配关键词：

```text
interactivebrokers
interactive brokers
ibkr
```

附件匹配：

```text
contentType = application/pdf
或 filename 以 .pdf 结尾
```

附件名优先匹配：

```text
DailyTradeRep
DailyTradeReport
TradeRep
TradeReport
```

---

## 6. PDF 解析要求

### 6.1 解析方式

优先使用规则解析，不使用 AI。

建议使用：

```text
pdf-parse
或 pdfjs-dist
```

流程：

```text
PDF buffer
→ 提取文本
→ 定位 Trades 表格
→ 解析交易行
→ 转为标准化交易结构
```

当前 IBKR Daily Trade Report PDF 有文本层，不需要 OCR。

### 6.2 不做的事情

本阶段不做：

```text
OCR
AI 解析
扫描版 PDF 识别
复杂多格式 PDF 自适应
```

如果 PDF 文本为空或字段缺失：

```text
status = ERROR
errorMessage = 说明原因
```

---

## 7. PDF 中需要解析的字段

从 Daily Trade Report 的 Trades 表格中解析：

```text
Acct ID
Symbol
Trade Date/Time
Settle Date
Exchange
Type
Quantity
Price
Proceeds
Comm
Fee
Order Type
Code
Currency
```

示例解析结果：

```ts
{
  broker: 'IBKR',
  accountId: 'U***66165',
  symbol: 'NVDA',
  tradeDateTime: '2026-05-21 22:06:14',
  settleDate: '2026-05-26',
  side: 'BUY',
  quantity: 5,
  price: 220.2,
  proceeds: -1101.0,
  commission: -0.35,
  fee: 0,
  currency: 'USD',
  orderType: 'LMT',
  code: 'O',
  source: 'IBKR_EMAIL_PDF'
}
```

---

## 8. 标准化交易结构

建议转为统一结构，尽量复用 CSV Import 的交易入库逻辑。

```ts
export interface EmailPdfTradePreview {
  tempId: string;
  messageId: string;
  attachmentHash: string;
  broker: 'IBKR';
  accountId?: string;
  symbol: string;
  tradeDateTime: string;
  tradeDate: string;
  settleDate?: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  proceeds?: number;
  amount?: number;
  commission?: number;
  fee?: number;
  currency: string;
  orderType?: string;
  code?: string;
  source: 'IBKR_EMAIL_PDF';
  sourceHash: string;
  status: 'NEW' | 'DUPLICATE' | 'ERROR';
  errorMessage?: string;
  rawText?: string;
  rawData?: unknown;
}
```

字段说明：

```text
amount 可以使用 proceeds
commission 保留 PDF 中 Comm 字段
fee 保留 PDF 中 Fee 字段
tradeDate 从 tradeDateTime 中提取日期部分
```

---

## 9. sourceHash 去重规则

邮件导入需要三层去重。

### 9.1 邮件级去重

```text
messageId 已处理过 → 标记 DUPLICATE
```

### 9.2 附件级去重

```text
attachmentHash 已处理过 → 标记 DUPLICATE
```

attachmentHash 计算：

```text
sha256(pdf bytes)
```

### 9.3 交易级去重

交易 sourceHash 建议：

```text
hash(
  broker +
  accountId +
  tradeDateTime +
  symbol +
  side +
  quantity +
  price +
  proceeds +
  commission +
  fee +
  currency
)
```

如果 sourceHash 已存在：

```text
status = DUPLICATE
```

注意：

```text
即使邮件或附件重复，也要在预览中展示 DUPLICATE 状态，方便用户理解。
```

---

## 10. 后端接口建议

### 10.1 扫描并解析预览

新增或调整接口：

```text
POST /api/email-sync/scan-and-preview
```

请求：

```ts
export interface EmailScanAndPreviewDto {
  range: '3d' | '7d' | '30d' | '90d';
}
```

返回：

```ts
export interface EmailScanAndPreviewResponse {
  scannedCount: number;
  matchedCount: number;
  attachmentCount: number;
  parsedTradeCount: number;
  newCount: number;
  duplicateCount: number;
  errorCount: number;
  mails: EmailImportMailItem[];
  trades: EmailPdfTradePreview[];
  warnings: string[];
}
```

### 10.2 确认导入

新增接口：

```text
POST /api/email-sync/confirm-import
```

请求：

```ts
export interface ConfirmEmailImportDto {
  trades: EmailPdfTradePreview[];
}
```

逻辑：

```text
只处理 status = NEW 的记录
再次检查 sourceHash 是否已存在
NEW 写入 trades / transactions
DUPLICATE 跳过
ERROR 不入库
生成 ImportJob / ImportRecord
更新 EmailMessageRecord 状态
导入完成后按设置决定是否刷新行情、重建快照、重算指标
```

返回：

```ts
export interface ConfirmEmailImportResponse {
  importJobId: string;
  insertedCount: number;
  duplicateCount: number;
  errorCount: number;
  warnings: string[];
}
```

---

## 11. 数据表建议

复用或新增：

```text
EmailSyncJob
EmailMessageRecord
ImportJob
ImportRecord
trades / transactions
```

### 11.1 EmailMessageRecord

用于记录邮件和附件处理状态：

```ts
EmailMessageRecord {
  id
  userId
  emailAccountId
  messageId
  subject
  from
  receivedAt
  attachmentNames
  attachmentHashes
  status
  errorMessage
  createdAt
  updatedAt
}
```

状态建议：

```text
FOUND
PARSED
IMPORTED
DUPLICATE
FAILED
```

### 11.2 ImportJob / ImportRecord

邮件 PDF 导入也要写入导入日志。

ImportJob source：

```text
IBKR_EMAIL_PDF
```

ImportRecord recordType：

```text
TRADE
```

ImportRecord status：

```text
SUCCESS
DUPLICATE
FAILED
```

---

## 12. 前端页面展示

Email Import 页面需要展示：

### 12.1 扫描控制区

```text
扫描范围：3 天 / 7 天 / 30 天 / 90 天
扫描并解析按钮
```

默认：

```text
3 天
```

### 12.2 扫描统计

展示：

```text
扫描邮件数 scannedCount
匹配邮件数 matchedCount
PDF 附件数 attachmentCount
解析交易数 parsedTradeCount
新增记录数 newCount
重复记录数 duplicateCount
错误记录数 errorCount
```

### 12.3 邮件列表

展示：

```text
Subject
From
Received At
Attachment Filename
Status
Error
```

### 12.4 交易预览表格

展示：

```text
Status
Symbol
Side
Quantity
Price
Proceeds
Commission
Fee
Trade Date/Time
Settle Date
Currency
Source Hash
Error
```

### 12.5 确认导入按钮

只有存在 `status = NEW` 的记录时，才允许点击：

```text
确认导入
Confirm Import
```

点击后调用：

```text
POST /api/email-sync/confirm-import
```

---

## 13. 用户数据隔离

所有操作必须基于当前登录用户：

```text
userId = currentUser.id
```

要求：

```text
只能读取当前用户的 EmailSyncAccount
只能写入当前用户的 EmailSyncJob / EmailMessageRecord
只能写入当前用户的 trades / import logs
不能访问其它用户邮箱和数据
```

---

## 14. 安全要求

必须满足：

```text
授权码不能打印到日志
授权码不能返回给前端
不读取其它用户邮箱
不删除邮件
不移动邮件
不标记邮件已读
PDF 附件内容不要直接展示在页面
rawText 如需保存，必须控制长度或只保存到 rawData 中
```

建议：

```text
rawText 默认不在前端完整展示，只用于调试或错误定位
```

---

## 15. 状态处理

页面需要支持：

```text
loading
scanning
parsing
previewReady
confirming
success
empty
error
warnings
```

empty 文案：

```text
最近 3 天未找到 IBKR 交易报告邮件
```

---

## 16. 本阶段不做

本阶段暂时不做：

```text
AI 解析
OCR
自动定时任务
后台队列
自动导入
标记邮件已读
删除邮件
解析现金流水
解析公司行动
解析非 Daily Trade Report PDF
```

---

## 17. 后续阶段预留

后续可以继续做：

```text
1. 定时任务每天自动扫描最近 3 天邮件
2. 自动进入待确认队列
3. AI fallback 解析异常 PDF
4. 支持更多 IBKR 邮件格式
5. 解析现金流水或公司行动附件
```

---

## 18. 验收标准

完成后需要满足：

1. Email Import 默认扫描最近 3 天邮件
2. 扫描范围支持 3d / 7d / 30d / 90d
3. 能读取 IBKR 交易报告邮件的 PDF 附件
4. 能提取 PDF 文本
5. 能用规则解析 Daily Trade Report 的 Trades 表格
6. 能生成交易预览表格
7. 能计算 sourceHash
8. 能识别 NEW / DUPLICATE / ERROR
9. 能确认导入 NEW 交易记录
10. DUPLICATE 不重复入库
11. ERROR 不入库并展示错误原因
12. 能写入 ImportJob / ImportRecord
13. 不标记邮件已读
14. 不删除邮件
15. 不使用 AI / OCR
16. 所有数据只作用于当前登录用户
17. 不影响 CSV Import 和其它页面