# Current Stage：Email Import 邮件导入扫描页开发

## 1. 当前阶段目标

本阶段目标是在当前邮箱配置已经完成的基础上，开发 **Email Import / 邮件导入扫描功能**。

当前用户已经可以在 Settings 页面中配置 QQ / 163 邮箱，并通过 IMAP 测试连接成功。下一步需要使用已保存的邮箱配置，扫描邮箱中的 IBKR 交易报告邮件，并读取邮件中的 PDF 附件元信息，为后续 PDF 解析和交易导入做准备。

本阶段只做：

```text
扫描 IBKR 交易邮件
读取 PDF 附件元信息
展示邮件和附件列表
记录 messageId 和 attachmentHash
```

本阶段不做：

```text
PDF 文本解析
AI 解析
交易预览
确认导入
自动定时同步
邮件已读标记
```

---

## 2. 当前背景

当前项目已经完成：

- Overview 首页
- Holdings 当前持仓
- Transactions 交易明细
- Cash Flows 现金流水
- Analytics / Performance 收益分析页
- Trading Behavior 交易行为分析页
- IBKR CSV Imports 数据导入页
- Auth 用户系统与数据隔离
- Settings Email 邮件配置
- QQ / 163 邮箱 IMAP 连接测试

现在需要在 Imports 页面新增 Email Import Tab，用来扫描 IBKR 交易确认邮件。

IBKR 邮件特征示例：

```text
发件人：Interactive Brokers Client Services
标题：05/21/2026日交易报告
附件：DailyTradeRep...pdf
```

---

## 3. 页面位置

建议在 Imports / 数据导入页面增加 Tab：

```text
Imports / 数据导入

Tabs:
1. CSV Import
2. Email Import
```

本阶段重点开发：

```text
Email Import
```

不要新建独立大页面，除非当前项目路由结构已有单独邮件导入页。

---

## 4. Email Import 页面功能

### 4.1 邮箱连接状态

页面顶部展示当前用户邮箱连接状态：

```text
邮箱服务商：QQ 邮箱 / 163 邮箱
邮箱地址
连接状态：CONNECTED / DISCONNECTED / ERROR
最近测试时间 lastTestAt
最近同步时间 lastSyncAt
```

如果用户未配置邮箱，显示提示：

```text
请先到 Settings / Email 中配置邮箱连接。
```

并提供跳转按钮：

```text
前往邮箱设置
```

---

### 4.2 扫描范围选择

支持选择扫描范围：

```text
最近 7 天
最近 30 天
最近 90 天
```

默认使用 Settings Email 配置中的：

```text
defaultScanRange
```

如果没有配置，默认：

```text
30d
```

---

### 4.3 扫描按钮

按钮文案：

```text
扫描 IBKR 邮件
Scan IBKR Emails
```

点击后：

```text
使用当前用户已保存的 EmailSyncAccount
通过 IMAP 连接邮箱
搜索指定时间范围内的 IBKR 交易报告邮件
读取邮件 PDF 附件元信息
返回邮件列表和附件列表
```

按钮需要支持状态：

```text
idle
scanning
success
error
```

---

### 4.4 扫描结果概览

扫描完成后展示：

```text
Scanned Count 扫描邮件数
Matched Count 匹配邮件数
Attachment Count PDF 附件数
New Count 新邮件数
Duplicate Count 已处理邮件数
Error Count 失败数
```

---

### 4.5 邮件列表

表格字段建议：

```text
Status 状态
Subject 邮件标题
From 发件人
Received At 接收时间
Attachment Count 附件数量
PDF Attachments PDF 附件名
Message ID
Action 操作
```

状态建议：

```text
NEW
DUPLICATE
ERROR
```

展示规则：

```text
NEW：未处理的新邮件
DUPLICATE：messageId 或 attachmentHash 已存在
ERROR：邮件读取或附件解析失败
```

---

### 4.6 附件列表

可以在邮件行中展开展示 PDF 附件：

```text
filename
contentType
size
attachmentHash
```

本阶段只读取附件元信息和计算 hash，不解析 PDF 内容。

---

## 5. 邮件匹配规则

IBKR 交易报告邮件可以通过以下规则识别。

### 5.1 标题匹配

邮件标题可能类似：

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

### 5.2 发件人匹配

from 中包含以下任一关键词：

```text
interactivebrokers
interactive brokers
ibkr
```

注意：

```text
不要只依赖发件人显示名
不同邮箱客户端可能显示不同
```

### 5.3 附件匹配

附件必须是 PDF：

```text
contentType = application/pdf
或 filename 以 .pdf 结尾
```

如果附件名包含以下关键词，优先识别：

```text
DailyTradeRep
DailyTradeReport
TradeRep
TradeReport
```

---

## 6. 后端接口建议

### 6.1 搜索 IBKR 邮件

建议新增接口：

```text
POST /api/email-sync/search-ibkr-mails
```

请求：

```ts
export interface SearchIbkrMailsDto {
  range: '7d' | '30d' | '90d';
}
```

返回：

```ts
export interface SearchIbkrMailsResponse {
  scannedCount: number;
  matchedCount: number;
  attachmentCount: number;
  newCount: number;
  duplicateCount: number;
  errorCount: number;
  mails: EmailImportMailItem[];
  warnings: string[];
}

export interface EmailImportMailItem {
  messageId: string;
  subject: string;
  from: string;
  receivedAt: string;
  attachments: EmailImportAttachmentItem[];
  status: 'NEW' | 'DUPLICATE' | 'ERROR';
  errorMessage?: string;
}

export interface EmailImportAttachmentItem {
  filename: string;
  contentType: string;
  size: number;
  attachmentHash: string;
}
```

---

## 7. 数据库设计建议

为了避免重复扫描和重复处理邮件，建议新增或复用以下表。

### 7.1 EmailMessageRecord

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

字段说明：

```text
messageId：邮箱中的邮件唯一 ID
attachmentHashes：PDF 附件 hash 列表
status：NEW / FOUND / DUPLICATE / PARSED / IMPORTED / FAILED
```

本阶段扫描到邮件后可以记录为：

```text
FOUND
```

如果已经存在相同 messageId 或 attachmentHash，则标记为：

```text
DUPLICATE
```

---

### 7.2 EmailSyncJob

建议记录每次扫描任务：

```ts
EmailSyncJob {
  id
  userId
  emailAccountId
  status
  startedAt
  finishedAt
  scannedCount
  matchedCount
  attachmentCount
  newCount
  duplicateCount
  errorCount
  errorMessage
  createdAt
}
```

状态：

```text
PENDING
SUCCESS
PARTIAL
FAILED
```

本阶段不需要解析交易，只记录扫描结果。

---

## 8. IMAP 技术实现建议

后端建议使用：

```text
imapflow
mailparser
```

处理流程：

```text
1. 读取当前用户 EmailSyncAccount
2. 检查 status 是否 CONNECTED
3. 解密 authSecretEncrypted
4. 根据 provider 获取 imapHost / imapPort / secure
5. 使用 imapflow 连接邮箱
6. 打开 INBOX
7. 按 range 搜索最近邮件
8. fetch 邮件 envelope / source
9. 使用 mailparser 解析 MIME
10. 根据标题 / 发件人 / PDF 附件过滤 IBKR 交易报告
11. 计算 PDF 附件 attachmentHash
12. 写入 EmailSyncJob / EmailMessageRecord
13. 返回扫描结果
14. logout
```

注意：

```text
不要标记邮件已读
不要删除邮件
不要移动邮件
不要发送邮件
不要解析 PDF 内容
```

---

## 9. 去重规则

本阶段做两层去重。

### 9.1 邮件级去重

如果 `messageId` 已存在：

```text
status = DUPLICATE
```

### 9.2 附件级去重

如果 `attachmentHash` 已存在：

```text
status = DUPLICATE
```

附件 hash 建议：

```text
attachmentHash = sha256(pdf bytes)
```

这样可以防止：

```text
同一封邮件重复扫描
同一个 PDF 附件重复处理
转发邮件导致同一个 PDF 重复出现
```

后续交易导入阶段还需要继续用交易级 `sourceHash` 去重。

---

## 10. 用户数据隔离

所有数据必须绑定当前用户：

```text
userId = currentUser.id
```

要求：

```text
只能使用当前用户的 EmailSyncAccount
只能写入当前用户的 EmailSyncJob
只能写入当前用户的 EmailMessageRecord
不能访问其它用户邮箱配置
不能读取其它用户邮件记录
```

未登录：

```text
返回 401
```

---

## 11. 前端状态处理

Email Import Tab 需要支持：

```text
loading
scanning
success
empty
error
warnings
```

### 11.1 loading

加载邮箱配置和最近扫描记录。

### 11.2 scanning

点击扫描按钮后展示扫描中状态。

### 11.3 success

扫描成功后展示统计和邮件列表。

### 11.4 empty

没有找到 IBKR 邮件时显示：

```text
未找到 IBKR 交易报告邮件
```

### 11.5 error

扫描失败时展示错误提示。

### 11.6 warnings

例如：

```text
邮箱未连接，请先前往 Settings 配置
部分邮件读取失败
部分附件无法计算 hash
```

---

## 12. 安全要求

必须满足：

```text
授权码不能打印到日志
授权码不能返回给前端
不读取其它用户邮箱
不删除邮件
不标记邮件已读
不移动邮件
不发送邮件
邮件附件内容不要直接展示在页面
PDF 附件内容本阶段不解析、不保存全文
```

如果需要保存原始附件，必须等后续阶段明确设计。

本阶段只保存：

```text
附件文件名
附件大小
附件 contentType
attachmentHash
```

---

## 13. 本阶段不做

本阶段明确不做：

```text
不做 PDF 文本解析
不做 AI 解析
不做交易结构化
不做交易预览表格
不做确认入库
不做自动定时同步
不做邮件已读标记
不做邮件删除
不做附件原文展示
```

这些放到后续阶段。

---

## 14. 后续阶段预留

本阶段完成后，下一阶段可以做：

```text
1. 选择某封邮件 / PDF 附件
2. 提取 PDF 文本
3. 规则解析 Daily Trade Report
4. 转为 NormalizedTrade
5. 生成交易预览表格
6. 用户确认导入
7. sourceHash 去重
8. 写入交易记录
```

---

## 15. 验收标准

完成后需要满足：

1. Imports 页面新增 Email Import Tab
2. 能读取当前用户已配置的邮箱账号
3. 未配置邮箱时提示前往 Settings
4. 支持选择扫描范围：7d / 30d / 90d
5. 点击扫描后能通过 IMAP 搜索邮箱
6. 能匹配类似 `05/21/2026日交易报告` 的 IBKR 邮件
7. 能识别 PDF 附件
8. 能计算 attachmentHash
9. 能展示扫描统计
10. 能展示邮件列表和 PDF 附件列表
11. 能记录 messageId 和 attachmentHash
12. 重复 messageId 或 attachmentHash 标记为 DUPLICATE
13. 不解析 PDF
14. 不导入交易
15. 不标记邮件已读
16. 不删除邮件
17. 所有数据只作用于当前用户
18. 不影响 CSV Import 和其它页面