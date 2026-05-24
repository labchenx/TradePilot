# Current Stage：Settings Email 邮件配置页开发（QQ / 163 邮箱）

## 1. 当前阶段目标

本阶段目标是在 Settings / 设置页面中新增 **Email 邮件配置 Tab**，用于配置邮箱 IMAP 连接，为后续读取 IBKR 交易确认邮件 PDF 附件做准备。

当前项目已经完成：

- Overview 首页
- Holdings 当前持仓
- Transactions 交易明细
- Cash Flows 现金流水
- Analytics / Performance 收益分析页
- Trading Behavior 交易行为分析页
- IBKR CSV Imports 数据导入页
- Auth 用户系统与数据隔离
- Settings 页面简化与静态 UI 恢复

本阶段只打通 **邮箱配置与连接测试**，不做 PDF 解析、不做 AI 解析、不做自动导入。

本阶段邮箱服务商支持：

```text
QQ 邮箱
163 邮箱
```

二者都使用：

```text
IMAP + 邮箱授权码
```

---

## 2. 功能定位

Email 邮件配置的作用是让用户在系统中绑定邮箱，用于后续自动读取 IBKR 交易确认邮件中的 PDF 附件。

本阶段目标是完成：

```text
用户选择邮箱服务商
用户填写邮箱地址
用户填写邮箱授权码
保存邮箱配置
测试 IMAP 连接
展示连接状态
支持断开连接
保存默认扫描设置
```

后续阶段再基于该配置实现：

```text
搜索 IBKR 邮件
读取 PDF 附件
解析 Daily Trade Report
生成交易预览
确认导入
去重入库
```

---

## 3. 页面位置

Email 配置放在 Settings 页面中。

建议 Settings 使用 Tabs 或类似分组结构：

```text
Settings / 设置

Tabs:
1. Account 账户
2. Data & Sync 数据同步
3. Import 导入
4. Email 邮件
5. Advanced 高级
```

本阶段重点新增：

```text
Email 邮件
```

不要把 Email 配置做成新的独立大页面。

---

## 4. UI 要求

Settings 页面需要继续保持之前简洁静态 UI 风格。

要求：

```text
不要恢复成一整页纵向后台管理布局
不要把所有设置模块全部展开铺满页面
Email Tab 只展示必要表单和连接状态
保持白底卡片、圆角、轻阴影、统一间距
中英文混排但不要拥挤
```

Email Tab 建议包含：

```text
1. 说明卡片
2. 邮箱连接表单
3. 连接状态
4. 同步偏好设置
5. 操作按钮
```

---

## 5. Email Tab 具体内容

### 5.1 邮箱服务商

第一版支持：

```text
QQ 邮箱
163 邮箱
```

后端 provider 枚举建议：

```ts
type EmailProvider = 'QQ_MAIL' | 'NETEASE_163';
```

Provider 配置建议：

```ts
const EMAIL_PROVIDER_CONFIG = {
  QQ_MAIL: {
    label: 'QQ 邮箱',
    imapHost: 'imap.qq.com',
    imapPort: 993,
    secure: true,
  },
  NETEASE_163: {
    label: '163 邮箱',
    imapHost: 'imap.163.com',
    imapPort: 993,
    secure: true,
  },
};
```

前端只让用户选择：

```text
邮箱服务商：QQ 邮箱 / 163 邮箱
```

不要让用户手动填写：

```text
imapHost
imapPort
secure
```

这些由后端根据 provider 自动确定。

---

### 5.2 邮箱地址

字段：

```text
email
```

要求：

```text
用户输入邮箱地址
如果 provider = QQ_MAIL，建议校验 @qq.com
如果 provider = NETEASE_163，建议校验 @163.com
保留后续扩展其它邮箱的可能
```

示例：

```text
xxx@qq.com
xxx@163.com
```

---

### 5.3 授权码

字段：

```text
authCode
```

要求：

```text
使用 password input
不显示明文
不要把已保存的授权码返回给前端
前端只显示是否已配置授权码
```

说明文案必须明确：

```text
这里填写的是邮箱授权码，不是邮箱登录密码。
```

---

### 5.4 安全说明文案

Email Tab 中需要展示以下说明：

```text
请先在对应邮箱网页端开启 IMAP/SMTP 服务，并生成授权码。
这里填写的是邮箱授权码，不是邮箱登录密码。
TradePilot 只会读取 IBKR 交易确认邮件中的 PDF 附件，不会删除或发送邮件。
```

如果用户选择 QQ 邮箱，可以提示：

```text
QQ 邮箱：请在 QQ 邮箱网页端开启 IMAP/SMTP 服务，并生成授权码。
```

如果用户选择 163 邮箱，可以提示：

```text
163 邮箱：请在 163 邮箱网页端开启 IMAP/SMTP/POP3 服务，并生成客户端授权码。
```

---

### 5.5 连接状态

展示字段：

```text
status
lastTestAt
lastSyncAt
errorMessage
```

状态枚举：

```text
DISCONNECTED 未连接
CONNECTED 已连接
ERROR 连接失败
```

展示规则：

```text
CONNECTED 使用绿色状态
ERROR 使用红色状态
DISCONNECTED 使用灰色状态
```

如果连接失败，需要展示可读的错误信息。

---

### 5.6 操作按钮

需要提供：

```text
保存配置 Save
测试连接 Test Connection
断开连接 Disconnect
```

要求：

```text
保存配置只保存当前用户的邮箱设置
测试连接通过 provider 对应的 IMAP 配置连接邮箱
断开连接时清除 authSecretEncrypted
所有操作需要 loading / success / error 状态
```

---

### 5.7 同步偏好设置

本阶段只保存配置，不执行真正邮件同步。

字段建议：

```text
defaultScanRange 默认扫描范围：7d / 30d / 90d
onlyIbkrEmails 只搜索 IBKR 邮件：true
onlyPdfAttachments 只读取 PDF 附件：true
markAsRead 是否标记邮件已读：false
```

第一版推荐默认值：

```text
defaultScanRange = 30d
onlyIbkrEmails = true
onlyPdfAttachments = true
markAsRead = false
```

注意：

```text
本阶段不做自动同步
本阶段不做邮件扫描
本阶段不做 PDF 解析
这些设置只是为后续 Email Sync 做准备
```

---

## 6. 后端接口建议

### 6.1 获取邮箱配置

```text
GET /api/settings/email-sync
```

返回：

```ts
export interface EmailSyncSettingsResponse {
  id?: string;
  provider: 'QQ_MAIL' | 'NETEASE_163';
  providerLabel: string;
  email?: string;
  imapHost: string;
  imapPort: 993;
  secure: true;
  hasAuthSecret: boolean;
  status: 'DISCONNECTED' | 'CONNECTED' | 'ERROR';
  lastTestAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
  defaultScanRange: '7d' | '30d' | '90d';
  onlyIbkrEmails: boolean;
  onlyPdfAttachments: boolean;
  markAsRead: boolean;
}
```

注意：

```text
不要返回 authSecretEncrypted
不要返回 authCode
只返回 hasAuthSecret
```

---

### 6.2 保存邮箱配置

```text
PUT /api/settings/email-sync
```

请求：

```ts
export interface UpdateEmailSyncSettingsDto {
  provider: 'QQ_MAIL' | 'NETEASE_163';
  email: string;
  authCode?: string;
  defaultScanRange: '7d' | '30d' | '90d';
  onlyIbkrEmails: boolean;
  onlyPdfAttachments: boolean;
  markAsRead: boolean;
}
```

逻辑：

```text
校验当前用户
校验 provider 是否支持
根据 provider 自动设置 imapHost / imapPort / secure
校验 email 和 provider 是否匹配
如果传入 authCode，则加密保存
如果未传 authCode，则保留原有 authSecretEncrypted
保存 provider、email、同步偏好设置
```

---

### 6.3 测试连接

```text
POST /api/email-sync/test-connection
```

请求：

```ts
export interface TestEmailConnectionDto {
  provider?: 'QQ_MAIL' | 'NETEASE_163';
  email?: string;
  authCode?: string;
}
```

逻辑：

```text
如果请求中传入 provider / email / authCode，则优先使用请求中的值测试
如果没有传 authCode，则使用当前用户已保存的加密授权码解密后测试
根据 provider 获取 IMAP 配置
通过 IMAP 连接邮箱
只测试登录和打开 INBOX
不读取邮件内容
不标记已读
不删除邮件
更新 lastTestAt
成功后 status = CONNECTED
失败后 status = ERROR，并保存 errorMessage
```

返回：

```ts
{
  success: boolean;
  status: 'CONNECTED' | 'ERROR';
  message: string;
  lastTestAt: string;
}
```

---

### 6.4 断开连接

```text
POST /api/email-sync/disconnect
```

逻辑：

```text
清除当前用户的 authSecretEncrypted
status = DISCONNECTED
保留 provider、email 和偏好设置，方便用户之后重新连接
```

返回：

```ts
{
  success: true;
}
```

---

## 7. 数据库设计建议

新增或复用表：

```ts
EmailSyncAccount {
  id
  userId
  provider
  email
  imapHost
  imapPort
  secure
  authSecretEncrypted
  status
  lastTestAt
  lastSyncAt
  errorMessage
  defaultScanRange
  onlyIbkrEmails
  onlyPdfAttachments
  markAsRead
  createdAt
  updatedAt
}
```

字段说明：

```text
userId：当前用户
provider：QQ_MAIL / NETEASE_163
email：邮箱地址
imapHost：由 provider 自动确定
imapPort：993
secure：true
authSecretEncrypted：加密后的授权码
status：DISCONNECTED / CONNECTED / ERROR
lastTestAt：最近测试连接时间
lastSyncAt：后续邮件同步时间，本阶段可为空
errorMessage：连接失败原因
defaultScanRange：默认扫描范围
onlyIbkrEmails：后续是否只搜索 IBKR 邮件
onlyPdfAttachments：后续是否只处理 PDF 附件
markAsRead：是否标记邮件已读，默认 false
```

同一用户第一版只需要一个 EmailSyncAccount。

可以增加唯一约束：

```text
userId + provider
```

如果希望一个用户只能绑定一个邮箱，也可以使用：

```text
userId 唯一
```

第一版建议：

```text
同一用户只绑定一个邮箱账户
```

---

## 8. IMAP 技术实现建议

Node 后端建议使用：

```text
imapflow
mailparser
```

本阶段只需要 `imapflow` 测试连接即可。

测试连接流程：

```text
根据 provider 获取 imapHost / imapPort / secure
创建 ImapFlow client
auth.user = email
auth.pass = authCode
connect
mailboxOpen('INBOX')
logout
```

Provider 对应配置：

```text
QQ_MAIL:
  host = imap.qq.com
  port = 993
  secure = true

NETEASE_163:
  host = imap.163.com
  port = 993
  secure = true
```

注意：

```text
不要读取邮件
不要下载附件
不要标记邮件已读
不要删除邮件
```

---

## 9. 授权码安全要求

必须满足：

```text
授权码不能明文保存
授权码不能返回给前端
授权码不能打印到日志
授权码需要加密后存储
断开连接时清除 authSecretEncrypted
```

加密建议：

```text
使用服务端环境变量 EMAIL_SECRET_KEY
使用 AES-GCM 或项目中已有加密工具
```

环境变量建议：

```text
EMAIL_SECRET_KEY
```

如果当前阶段暂时没有完善加密工具，可以先实现一个清晰的 encrypt/decrypt service，并在代码注释中说明后续需要安全管理密钥。

---

## 10. 用户数据隔离要求

所有邮箱配置都必须绑定当前登录用户：

```text
userId = currentUser.id
```

所有接口都必须鉴权：

```text
未登录返回 401
只能读取和修改当前用户的 EmailSyncAccount
不能访问其它用户配置
```

---

## 11. 前端状态处理

Email Tab 需要支持：

```text
loading
saving
testing
disconnecting
success
error
```

状态说明：

```text
loading：加载已有邮箱配置
saving：保存配置中
testing：测试连接中
disconnecting：断开连接中
success：操作成功提示
error：操作失败提示
```

---

## 12. 本阶段不做

本阶段明确不做：

```text
不做邮件扫描
不做 PDF 附件下载
不做 PDF 文本解析
不做 AI 解析
不做交易预览
不做确认导入
不做自动定时同步
不做 Gmail OAuth
不做邮件发送
不删除邮件
不标记邮件已读
```

这些放到后续阶段处理。

---

## 13. 后续阶段预留

本阶段完成后，后续可以继续做：

```text
1. 搜索 IBKR 邮件
2. 读取 PDF 附件
3. 提取 PDF 文本
4. 规则解析 Daily Trade Report
5. 生成交易预览
6. 用户确认导入
7. messageId / attachmentHash / sourceHash 去重
8. 自动增量同步
```

因此本阶段的 EmailSyncAccount 设计要为后续扩展保留：

```text
lastSyncAt
defaultScanRange
onlyIbkrEmails
onlyPdfAttachments
markAsRead
```

---

## 14. 验收标准

完成后需要满足：

1. Settings 页面新增 Email 邮件 Tab
2. Email Tab 保持 Settings 简洁静态 UI 风格
3. 第一版支持 QQ 邮箱和 163 邮箱
4. 用户可以选择邮箱服务商
5. 用户可以输入邮箱地址
6. 用户可以输入邮箱授权码
7. 页面明确提示“授权码不是邮箱登录密码”
8. 用户可以保存邮箱配置
9. 授权码加密保存，不明文入库
10. 前端不会回显授权码
11. 用户可以测试 IMAP 连接
12. 测试连接只打开 INBOX，不读取邮件、不下载附件、不标记已读
13. 页面能显示 CONNECTED / DISCONNECTED / ERROR 状态
14. 用户可以断开连接
15. 断开连接会清除 authSecretEncrypted
16. 同步偏好设置可以保存
17. 所有操作只作用于当前登录用户
18. 本阶段不做 PDF 解析和交易导入
19. 不影响 Settings 其它 Tab 和已完成业务页面