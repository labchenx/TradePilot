# Current Stage：Email Auto Sync 邮件自动同步定时任务

## 1. 当前阶段目标

本阶段目标是在现有 Email Import 邮件导入能力基础上，新增 **每天早上 7 点自动同步 IBKR 交易邮件** 的定时任务。

当前项目已经完成或正在完成：

- 用户系统与 userId 数据隔离
- Settings Email 邮箱配置
- QQ / 163 邮箱 IMAP 连接
- Imports / Email Import 邮件扫描
- IBKR Daily Trade Report PDF 附件读取
- PDF 文本提取与规则解析
- 交易预览与确认导入
- sourceHash 去重
- ImportJob / ImportRecord 导入日志

本阶段采用：

```text
NestJS Schedule
```

第一版不引入 BullMQ / Redis。

---

## 2. 方案选择

当前项目只有个人和少量朋友使用，部署计划是单实例后端服务，因此第一版使用 NestJS Schedule 最合适。

推荐方案：

```text
NestJS Schedule
每天 07:00 执行
扫描已开启自动同步的邮箱
默认扫描最近 3 天
解析 IBKR PDF 交易报告
NEW 交易自动入库
DUPLICATE 跳过
ERROR 写入日志
同步完成后刷新行情、重建快照、重算指标
```

暂时不使用：

```text
BullMQ
Redis
复杂任务队列
多实例分布式锁
复杂 cron 表达式配置
多时区用户配置
```

后续如果部署多实例或用户数量增加，再升级为 BullMQ + Redis 或外部 Cron 触发。

---

## 3. 定时任务时间

每天早上 7 点执行。

建议明确时区，不要依赖服务器默认时区。

如果项目主要给国内用户使用：

```text
Asia/Shanghai
```

如果项目主要给日本环境使用：

```text
Asia/Tokyo
```

第一版可以写死一个项目默认时区，例如：

```text
Asia/Tokyo
```

或者通过环境变量配置：

```text
APP_TIMEZONE=Asia/Tokyo
```

Cron 表达式示例：

```text
0 0 7 * * *
```

含义：

```text
每天 07:00:00 执行
```

---

## 4. 自动同步范围

定时任务默认扫描最近 3 天邮件。

原因：

```text
1. 每天同步一次，理论上 1 天足够
2. 邮件可能延迟
3. 服务器可能偶尔停机
4. 时区可能导致日期边界差异
5. 扫描 3 天可以提高容错
6. messageId / attachmentHash / sourceHash 会防止重复入库
```

默认值：

```text
defaultScanRange = 3d
```

支持的范围仍保留：

```text
3d / 7d / 30d / 90d
```

但自动任务默认使用：

```text
3d
```

---

## 5. 核心流程

定时任务完整流程：

```text
1. 每天 07:00 触发 ScheduledEmailSyncService.runDailySync()
2. 查询 autoSyncEnabled = true 且 status = CONNECTED 的 EmailSyncAccount
3. 对每个邮箱账号创建 EmailSyncJob
4. triggerType = SCHEDULED
5. 扫描最近 3 天 IBKR 交易报告邮件
6. 读取 PDF 附件
7. 提取 PDF 文本
8. 规则解析 Daily Trade Report 的 Trades 表格
9. 生成标准化交易记录
10. 检查 messageId / attachmentHash / sourceHash
11. NEW 交易自动写入 trades / transactions
12. DUPLICATE 跳过
13. ERROR 写入 EmailSyncJob / ImportRecord / warnings
14. 生成 ImportJob / ImportRecord
15. 如果有新增交易，按用户导入设置触发：
    - refresh quotes
    - regenerate monthly snapshots
    - recalculate metrics
16. 更新 EmailSyncJob 状态
17. 更新 EmailSyncAccount.lastSyncAt
18. 记录 lastSyncStatus / errorMessage
```

---

## 6. 自动入库策略

手动导入流程是：

```text
扫描 → 解析预览 → 用户确认 → 入库
```

定时任务流程是：

```text
扫描 → 解析 → 校验 → NEW 自动入库 → 记录日志
```

但必须遵守：

```text
只有解析完整、字段校验通过、sourceHash 不重复的 NEW 交易才能自动入库
DUPLICATE 跳过
ERROR / 字段缺失 / 解析不确定 不入库
```

不确定的数据应进入日志，供用户后续在 Imports 页面查看。

---

## 7. 需要复用的现有能力

不要重新写一套邮件导入逻辑，必须复用现有 service：

```text
EmailSyncAccount
EmailSyncJob
EmailMessageRecord
Email PDF Parser
sourceHash 去重
ImportJob
ImportRecord
Import Confirm / Trade Insert Service
Quote refresh service
Monthly snapshot service
Portfolio metrics service
```

建议把手动导入和自动同步共用底层方法：

```ts
scanAndParseEmailTrades(userId, options)
importEmailTrades(userId, trades, options)
```

区别只在于：

```text
手动导入：返回预览，等待用户确认
自动同步：解析成功后直接导入 NEW 记录
```

---

## 8. 数据库字段建议

### 8.1 EmailSyncAccount 增加字段

```ts
EmailSyncAccount {
  id
  userId
  provider
  email
  status
  lastSyncAt
  lastSyncStatus
  lastSyncErrorMessage
  autoSyncEnabled
  syncTime
  defaultScanRange
  createdAt
  updatedAt
}
```

建议默认值：

```text
autoSyncEnabled = true
syncTime = '07:00'
defaultScanRange = '3d'
```

如果不想第一版支持用户自定义时间，也可以先固定每天 07:00，但字段预留。

---

### 8.2 EmailSyncJob 增加字段

```ts
EmailSyncJob {
  id
  userId
  emailAccountId
  triggerType
  status
  startedAt
  finishedAt
  scannedCount
  matchedCount
  attachmentCount
  parsedTradeCount
  insertedCount
  duplicateCount
  errorCount
  errorMessage
  warnings
  createdAt
}
```

字段说明：

```text
triggerType: MANUAL / SCHEDULED
status: PENDING / RUNNING / SUCCESS / PARTIAL / FAILED
```

---

### 8.3 防重复字段

建议增加或确保存在：

```text
EmailMessageRecord.messageId
EmailMessageRecord.attachmentHashes
Trade.sourceHash
ImportRecord.sourceHash
```

---

## 9. 防重复执行

定时任务必须避免重复执行。

第一版可以用数据库简单锁策略。

### 9.1 任务级防重复

同一天同一用户只允许一个 scheduled job 正在运行：

```text
jobKey = userId + emailAccountId + yyyy-MM-dd + 'daily-email-sync'
```

如果已存在：

```text
status = RUNNING / PENDING
```

则跳过当前账号本次任务，并记录 warning。

### 9.2 数据级去重

即使任务重复触发，也必须依靠三层去重避免重复入库：

```text
messageId 去重
attachmentHash 去重
sourceHash 去重
```

---

## 10. Settings 页面调整

Settings / Email Tab 增加自动同步配置：

```text
自动同步开关
同步时间：每天 07:00
默认扫描范围：最近 3 天
最近同步时间
最近同步状态
最近同步错误信息
```

第一版可以简化：

```text
Auto Sync 自动同步：开启 / 关闭
Daily Sync Time：07:00
Scan Range：3 天
Last Sync：2026-05-24 07:00 成功
```

如果不想让用户改时间，`07:00` 可以只读展示。

---

## 11. Imports / Email Import 页面调整

Email Import 页面增加同步历史列表。

字段建议：

```text
同步时间
触发方式：手动 / 定时
状态
扫描邮件数
匹配邮件数
PDF 附件数
解析交易数
新增记录数
重复记录数
失败记录数
错误信息
```

这样用户可以看到每天早上 7 点自动同步的结果。

---

## 12. 后端接口建议

### 12.1 手动触发自动同步逻辑

为了测试方便，可以提供手动触发接口：

```text
POST /api/email-sync/run-now
```

用途：

```text
手动执行一次与定时任务相同的同步逻辑
triggerType = MANUAL
默认扫描 3d
```

这有助于开发调试和用户手动补同步。

### 12.2 获取同步历史

```text
GET /api/email-sync/jobs
```

支持查询：

```text
triggerType
status
page
pageSize
```

### 12.3 更新自动同步设置

可以复用：

```text
PUT /api/settings/email-sync
```

新增字段：

```ts
autoSyncEnabled?: boolean;
syncTime?: string;
defaultScanRange?: '3d' | '7d' | '30d' | '90d';
```

---

## 13. 自动同步后处理

如果本次自动同步插入了新的交易记录：

```text
insertedCount > 0
```

则根据 Import Settings 决定是否执行：

```text
autoRefreshQuotesAfterImport
autoRegenerateSnapshotsAfterImport
autoRecalculateMetricsAfterImport
```

建议默认开启。

后处理流程：

```text
刷新当前行情
重新生成月度资产快照
重新计算 Overview / Analytics 指标
```

如果后处理失败：

```text
交易记录不回滚
EmailSyncJob status 可标记为 PARTIAL
warnings 中记录后处理错误
```

---

## 14. 错误处理

错误处理策略：

```text
单个用户同步失败，不影响其它用户
单封邮件失败，不影响其它邮件
单个 PDF 解析失败，不影响其它附件
单笔交易解析失败，不影响其它交易
```

状态规则：

```text
全部成功：SUCCESS
部分失败：PARTIAL
全部失败：FAILED
```

必须记录：

```text
errorMessage
warnings
failedCount
```

---

## 15. 安全要求

必须满足：

```text
授权码不能打印到日志
授权码不能返回前端
只处理当前用户自己的 EmailSyncAccount
不删除邮件
不移动邮件
不标记邮件已读
解析失败的交易不自动入库
不要使用 AI / OCR
```

---

## 16. 本阶段不做

本阶段暂不做：

```text
BullMQ / Redis
多实例分布式锁
复杂任务监控面板
AI fallback
OCR
自动标记邮件已读
自动删除邮件
多时区用户配置
用户自定义 cron 表达式
```

---

## 17. 验收标准

完成后需要满足：

1. 后端集成 NestJS Schedule
2. 每天早上 7 点自动执行邮件同步任务
3. 自动任务默认扫描最近 3 天邮件
4. 只扫描 autoSyncEnabled = true 且 CONNECTED 的邮箱
5. 能识别 IBKR 交易报告邮件
6. 能读取 PDF 附件
7. 能解析 Daily Trade Report 中的交易记录
8. NEW 交易自动入库
9. DUPLICATE 交易跳过
10. ERROR 记录不入库并写入日志
11. 自动同步会生成 EmailSyncJob
12. 自动同步会生成 ImportJob / ImportRecord
13. 同步完成后更新 lastSyncAt
14. 有新增交易时触发行情刷新、快照重建、指标重算
15. Settings 能展示自动同步配置和最近同步状态
16. Imports 能展示同步历史
17. 不标记邮件已读
18. 不删除邮件
19. 不使用 AI / OCR
20. 不影响手动 CSV Import 和手动 Email Import