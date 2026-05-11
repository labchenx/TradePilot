# TradePilot Agent 规则

## 项目概览

TradePilot 是一个个人股票投资组合记录与分析平台。

它帮助用户：

- 记录买入和卖出交易
- 管理入金和出金
- 解析 IBKR 交易确认邮件
- 通过预览和确认流程导入交易记录
- 计算持仓、平均成本、已实现盈亏、未实现盈亏
- 可视化投资组合表现
- 在后续阶段使用 AI 总结股票新闻

TradePilot 不是投资建议产品。不要添加买入/卖出推荐功能。

---

## 用户背景

项目拥有者是一名有 5 年经验的前端开发者。

他希望通过这个项目学习：

- 后端开发
- NestJS
- PostgreSQL
- Prisma
- 数据建模
- 数据导入流程
- 金融计算逻辑
- API 集成
- 部署

生成后端代码时，请添加有帮助的注释，并解释重要的后端概念。

---

## 技术栈

### 前端

- React
- TypeScript
- Vite
- React Router
- Ant Design 或 shadcn/ui
- ECharts
- TanStack Query
- Axios

### 后端

- NestJS
- Prisma
- PostgreSQL
- class-validator
- Swagger
- JWT，后续阶段再加入

### 部署

- Docker
- Docker Compose
- 前端部署到 Vercel 或 Netlify
- 后端部署到 Render、Railway 或 VPS

---

## 当前开发原则

不要一次性开发完整项目。

始终按阶段开发。

写代码之前，需要：

1. 说明将会修改哪些文件
2. 说明为什么需要这些文件
3. 确认当前所处阶段
4. 避免加入当前阶段之外的功能

写代码之后，需要：

1. 总结修改了哪些文件
2. 提供测试命令
3. 为后端 API 提供 curl 示例
4. 解释用户应该从这一步学习什么

---

## MVP 范围

MVP 包含：

- 交易记录 CRUD
- 交易记录筛选、分页、排序
- IBKR 邮件样本解析
- 导入预览
- 导入确认
- sourceHash 重复检测
- 导入日志
- 持仓计算
- 资金流水管理
- 投资组合汇总
- 基础 Dashboard 图表

---

## 早期阶段不做的内容

除非用户明确要求，否则不要添加：

- 真实 Gmail 集成
- IBKR Flex Query
- AI 股票新闻总结
- 实时行情数据
- 登录和 JWT
- 多用户权限系统
- FIFO 或 LIFO 税务计算
- 股票推荐
- 自动买入/卖出建议
- 复杂微服务架构

---

## 架构规则

使用清晰的模块化结构。

后端模块应遵循以下模式：

- controller
- service
- dto
- module
- 必要时添加 tests

建议的后端模块：

- trades
- imports
- cash-flows
- positions
- portfolio
- market-data
- news
- ai
- auth

前端应使用以下结构：

- pages
- components
- services/api
- hooks
- types
- utils

避免把 API 请求直接写在大型组件内部。

---

## 数据规则

金额和数量字段需要考虑 Decimal 精度安全。

重要金融字段包括：

- quantity
- price
- fee
- amount
- averageCost
- marketValue
- realizedPnl
- unrealizedPnl

不要在关键金融计算中随意依赖 JavaScript 浮点数，需要考虑精度问题。

---

## 导入规则

IBKR 邮件导入必须遵循以下流程：

```txt
粘贴或上传邮件
→ 预览解析出的交易记录
→ 展示错误和重复记录
→ 用户确认导入
→ 生成 sourceHash
→ 跳过重复记录
→ 写入有效交易
→ 创建导入日志
```

不要在没有预览和确认的情况下，直接把解析出的邮件内容写入 Trade 表。

---

## 安全规则

不要在前端代码中暴露 API Key。

不要提交真实 IBKR 账户数据、邮件内容、API Key 或凭证。

使用 `.env` 存放密钥。

使用 mock 数据或匿名化样本。

除非用户明确要求，不要创建具有破坏性的脚本。

删除文件或文件夹之前，必须先说明原因。

---

## UI 规则

设计风格应为：

- 专业金融 SaaS Dashboard
- 清爽
- 数据优先
- 不要加密货币风
- 不要霓虹风
- 不要营销落地页风格

使用：

- 深色侧边栏
- 浅色主内容区
- 白色卡片
- 细边框
- 盈利用绿色
- 亏损用红色
- 蓝色作为主要操作色

---

## 测试规则

每个后端功能都需要：

- 提供 curl 示例
- 解释预期返回结果
- 说明常见错误情况

对于导入和计算类功能：

- 包含样本输入数据
- 包含预期输出
- 包含边界情况

---

## 学习规则

因为这个项目也用于学习，所以不要只生成代码。

每个任务都需要解释：

- 涉及什么后端概念
- 请求如何从前端流转到后端
- 数据如何存储
- 如何调试
- 这个功能在面试中可以怎么描述

---

## 开发协作规则

每次开始新任务前，Agent 应先阅读：

- `docs/product-requirements.md`
- `docs/development-roadmap.md`
- `docs/current-stage.md`
- `AGENTS.md`

如果当前需求和 `docs/current-stage.md` 冲突，应优先提醒用户，而不是直接实现阶段外功能。

---

## 代码质量规则

- 优先保持代码简单、清晰、可维护。
- 不要为了炫技引入复杂架构。
- 不要过早抽象。
- 不要在一个文件中堆积过多业务逻辑。
- 后端业务逻辑应优先放在 service 中。
- 前端组件应尽量拆分为可复用的小组件。
- 公共类型应放在 `types` 或共享目录中。
- API 请求应统一封装，不要散落在页面组件中。

---

## Git 与提交规则

建议每个阶段完成后进行一次 commit。

推荐提交格式：

- `chore: initialize TradePilot project`
- `feat: add trade CRUD APIs`
- `feat: add trade table and form`
- `feat: add trade filters and pagination`
- `feat: add IBKR email preview parser`
- `feat: add import confirmation and duplicate detection`
- `feat: add position calculation`
- `feat: add cash flow management`
- `feat: add portfolio dashboard`
- `docs: add learning notes`

---

## 面试表达规则

在总结每个阶段时，请额外帮助用户整理一段“面试中如何描述该功能”的表达。

表达应突出：

- 业务背景
- 技术实现
- 难点
- 解决方案
- 学到的能力

## 文档优先级

当文档之间存在冲突时，优先级如下：

1. `docs/current-stage.md`
2. `AGENTS.md`
3. `docs/product-requirements.md`
4. `docs/figma-ui-requirements.md`

`docs/product-requirements.md` 只作为产品背景和长期目标，不代表当前阶段需要全部实现。
