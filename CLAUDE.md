# TradePilot 个人投资组合记录与分析平台开发需求文档

## 1. 项目名称

**TradePilot**

中文名：**交易领航 / 个人投资组合记录与分析平台**

英文完整描述：

> TradePilot — Personal Portfolio Tracker

---

## 2. 项目背景

当前用户是一名有 5 年经验的前端开发者，希望通过一个真实项目学习后端、数据库、数据处理、第三方 API、自动化导入、数据可视化和 AI 应用开发能力。

用户计划开发一个股票数据相关的软件，用于记录和分析自己的股票投资行为，包括：

- 买入记录
- 卖出记录
- 入金记录
- 出金记录
- 当前持仓
- 持仓成本
- 已实现收益
- 未实现收益
- 总资产变化
- 持仓股票的重要资讯
- IBKR 邮件交易记录解析
- 后续可升级为 IBKR Flex Query 自动同步

该项目既满足真实个人需求，也适合作为简历项目展示，体现前端开发者向全栈、数据分析、AI 应用方向升级的能力。

---

## 3. 项目定位

TradePilot 是一个面向个人投资者的投资组合记录与分析平台。

它不是荐股软件，也不提供投资建议，而是帮助用户完成：

- 自动记录交易数据
- 管理资金流水
- 分析当前持仓
- 计算收益表现
- 可视化资产变化
- 汇总持仓股票资讯
- 辅助用户进行投资复盘

产品定位：

> 一个支持 IBKR 邮件导入、持仓收益计算、资产可视化和股票资讯摘要的个人投资组合分析系统。

---

## 4. 项目目标

### 4.1 产品目标

- 帮助用户统一管理股票交易记录。
- 支持手动录入和后续自动导入 IBKR 邮件交易数据。
- 自动计算持仓、成本、收益和资产变化。
- 通过图表展示投资组合表现。
- 聚合持仓股票相关资讯，并支持 AI 总结。
- 为用户提供清晰的投资复盘视图。

### 4.2 学习目标

通过该项目学习以下能力：

- React + TypeScript 前端项目开发
- NestJS 后端接口开发
- PostgreSQL 数据库设计
- Prisma ORM 使用
- RESTful API 设计
- DTO 参数校验
- 交易数据建模
- 邮件文本解析
- 数据导入、去重、幂等性设计
- 持仓和收益计算
- 第三方行情 API 接入
- ECharts 数据可视化
- AI API 调用与结构化摘要
- Docker 部署
- JWT 登录鉴权

---

## 5. 目标用户

### 5.1 主要用户

个人股票投资者，尤其是使用 IBKR 进行股票交易的用户。

### 5.2 当前阶段目标用户

项目初期只面向开发者本人使用，因此第一版不需要复杂多用户体系。

后续为了简历完整性，可以加入登录注册和用户数据隔离。

---

## 6. 核心功能模块

TradePilot 主要包含以下模块：

1. Dashboard 总览
2. 交易记录管理
3. IBKR 邮件导入
4. 资金流水管理
5. 当前持仓分析
6. 收益统计
7. 图表分析
8. 股票行情数据
9. 股票资讯与 AI 总结
10. 登录鉴权
11. 系统设置与数据源管理

---

## 7. MVP 功能范围

第一版 MVP 不追求完整自动化，只需要完成核心闭环：

```txt
手动录入交易记录
↓
交易记录列表展示
↓
计算当前持仓
↓
展示收益概览
↓
录入入金出金
↓
展示资产概览
```

### MVP 必做功能

- 交易记录 CRUD
- 资金流水 CRUD
- 当前持仓计算
- 收益概览
- 基础图表展示
- IBKR 邮件样本解析，不直接连接邮箱

### MVP 暂不做功能

- 实时行情自动同步
- 真实 Gmail 自动读取
- IBKR Flex Query 自动同步
- AI 股票资讯总结
- 多账户复杂权限
- 税务计算
- 复杂 FIFO / LIFO 成本法
- 自动荐股功能

---

## 8. 技术栈建议

### 8.1 前端技术栈

- React
- TypeScript
- Vite
- React Router
- Ant Design 或 shadcn/ui
- ECharts / Recharts
- TanStack Query
- Zustand 或 Redux Toolkit
- Axios

### 8.2 后端技术栈

- Node.js
- NestJS
- Prisma
- PostgreSQL
- class-validator
- JWT
- Swagger

### 8.3 数据与部署

- PostgreSQL
- Docker
- Docker Compose
- Supabase / Neon / Railway PostgreSQL
- Vercel / Netlify 前端部署
- Render / Railway / VPS 后端部署

### 8.4 后续可接入服务

- IBKR 邮件解析
- IBKR Flex Query
- 第三方股票行情 API
- 新闻 API
- OpenAI / 其他大模型 API

---

## 9. 页面结构

建议页面路由如下：

```txt
/dashboard        投资总览
/trades           交易记录
/cash-flows       资金流水
/positions        当前持仓
/stocks/:symbol   个股详情
/imports          数据导入
/news             股票资讯
/settings         系统设置
/login            登录
```

---

## 10. 功能需求详情

### 10.1 Dashboard 投资总览

#### 功能说明

Dashboard 用于展示用户投资组合的整体情况。

#### 核心内容

- 总资产
- 股票市值
- 现金余额
- 净入金
- 总收益
- 总收益率
- 今日涨跌
- 当前持仓数量
- 持仓股票数量
- 最近交易记录
- 资产变化曲线
- 持仓占比图

#### 页面组件

- 顶部统计卡片
- 资产趋势折线图
- 持仓占比饼图
- 最近交易列表
- 收益概览卡片

#### 后端接口

```txt
GET /portfolio/summary
GET /portfolio/performance
GET /positions
GET /trades/recent
```

---

### 10.2 交易记录管理

#### 功能说明

用户可以手动添加、查看、编辑、删除股票交易记录。

#### 交易类型

- BUY 买入
- SELL 卖出
- DIVIDEND 分红，后续支持
- FEE 费用，后续支持
- TAX 税费，后续支持

#### 字段设计

```txt
Trade
- id
- broker                券商，例如 IBKR
- accountId             券商账号，可选
- symbol                股票代码，例如 AMD
- name                  股票名称
- type                  BUY / SELL
- quantity              数量
- price                 成交价
- fee                   手续费
- currency              币种，例如 USD
- tradeDate             交易日期
- source                MANUAL / EMAIL / FLEX_QUERY
- sourceMessageId        邮件 ID，可选
- sourceHash             原始数据 hash，用于去重
- rawData                原始解析数据 JSON
- note                  备注
- createdAt
- updatedAt
```

#### 页面功能

- 交易记录列表
- 新增交易记录
- 编辑交易记录
- 删除交易记录
- 按股票代码搜索
- 按交易类型筛选
- 按日期范围筛选
- 分页
- 排序

#### 接口设计

```txt
GET /trades
GET /trades/:id
POST /trades
PUT /trades/:id
DELETE /trades/:id
```

#### 查询参数

```txt
GET /trades?page=1&pageSize=20&symbol=AMD&type=BUY&startDate=2025-01-01&endDate=2025-12-31
```

#### 返回结构

```json
{
  "list": [],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

---

### 10.3 IBKR 邮件导入模块

#### 功能说明

系统支持从 IBKR 邮件中解析交易记录，并导入到 Trade 表。

第一阶段不直接连接 Gmail 或邮箱 API，而是先支持用户粘贴邮件正文或上传邮件文本样本。

后续再扩展为自动读取邮箱。

#### 处理流程

```txt
用户粘贴 IBKR 邮件正文
↓
系统解析邮件内容
↓
生成交易记录预览
↓
用户确认导入
↓
系统生成 sourceHash
↓
检查是否重复
↓
写入 Trade 表
↓
生成导入日志
```

#### 页面功能

- 粘贴 IBKR 邮件正文
- 上传邮件 HTML / TXT 文件
- 点击“解析预览”
- 展示解析出的交易记录
- 标记解析失败字段
- 确认导入
- 展示导入结果
- 查看历史导入记录

#### 核心接口

```txt
POST /imports/ibkr-email/preview
POST /imports/ibkr-email/confirm
GET /imports/history
GET /imports/:id
```

#### Parser 方法

```ts
parseIbkrEmail(content: string): TradeImportItem[]
```

#### 统一解析结构

```json
{
  "broker": "IBKR",
  "symbol": "AMD",
  "type": "BUY",
  "quantity": 10,
  "price": 150.25,
  "fee": 1,
  "currency": "USD",
  "tradeDate": "2026-04-28",
  "source": "EMAIL"
}
```

#### 去重规则

为每条交易生成 sourceHash：

```txt
sourceHash = hash(broker + accountId + symbol + type + quantity + price + tradeDate + currency)
```

数据库中对 sourceHash 建立唯一约束，避免重复导入。

#### 需要处理的边界情况

- 同一封邮件重复导入
- 一封邮件包含多笔交易
- 手续费字段缺失
- 币种字段缺失
- 日期格式不同
- 邮件格式变化
- 部分记录解析失败
- 重复记录跳过
- 导入任务部分成功

---

### 10.4 导入日志模块

#### 功能说明

记录每次导入任务的状态、成功数量、失败数量和重复数量。

#### 表结构

```txt
ImportJob
- id
- source             IBKR_EMAIL / IBKR_FLEX
- status             PENDING / SUCCESS / FAILED / PARTIAL
- startedAt
- finishedAt
- totalCount
- successCount
- failedCount
- duplicateCount
- errorMessage
- createdAt
```

```txt
ImportRecord
- id
- importJobId
- recordType         TRADE / CASH_FLOW
- sourceHash
- status             SUCCESS / DUPLICATE / FAILED
- rawData
- errorMessage
- createdAt
```

#### 页面功能

- 查看导入历史
- 查看每次导入详情
- 展示成功、失败、重复记录
- 展示失败原因

---

### 10.5 资金流水管理

#### 功能说明

用于记录入金、出金、分红、税费、利息和换汇等资金变动。

#### 流水类型

- DEPOSIT 入金
- WITHDRAW 出金
- DIVIDEND 分红
- INTEREST 利息
- TAX 税费
- FEE 费用
- FX_EXCHANGE 换汇

#### 表结构

```txt
CashFlow
- id
- broker
- accountId
- type
- amount
- currency
- flowDate
- source          MANUAL / EMAIL / FLEX_QUERY
- sourceHash
- rawData
- note
- createdAt
- updatedAt
```

#### 页面功能

- 新增资金流水
- 编辑资金流水
- 删除资金流水
- 资金流水列表
- 按类型筛选
- 按币种筛选
- 按日期范围筛选

#### 接口设计

```txt
GET /cash-flows
GET /cash-flows/:id
POST /cash-flows
PUT /cash-flows/:id
DELETE /cash-flows/:id
```

---

### 10.6 当前持仓分析

#### 功能说明

根据交易记录自动计算当前持仓。

第一版使用移动平均成本法。

#### 计算指标

- 股票代码
- 股票名称
- 当前持仓数量
- 平均成本
- 总成本
- 当前价格
- 当前市值
- 已实现盈亏
- 未实现盈亏
- 总盈亏
- 收益率
- 手续费合计

#### 接口设计

```txt
GET /positions
GET /positions/:symbol
```

#### 示例返回

```json
{
  "symbol": "AMD",
  "quantity": 15,
  "averageCost": 110,
  "totalCost": 1650,
  "marketPrice": 150,
  "marketValue": 2250,
  "unrealizedPnl": 600,
  "unrealizedPnlRate": 0.3636
}
```

#### 学习重点

- 移动平均成本法
- 数据聚合
- 买入卖出逻辑处理
- 手续费处理
- Decimal 精度处理
- 边界情况处理

---

### 10.7 收益统计模块

#### 功能说明

根据交易记录、资金流水和行情价格计算整体收益情况。

#### 核心指标

- 总入金
- 总出金
- 净入金
- 当前现金余额
- 股票总市值
- 总资产
- 已实现收益
- 未实现收益
- 总收益
- 总收益率

#### 接口设计

```txt
GET /portfolio/summary
GET /portfolio/performance
```

---

### 10.8 图表分析模块

#### 功能说明

通过图表展示投资组合变化和收益表现。

#### 图表类型

- 资产净值曲线
- 收益曲线
- 持仓市值占比饼图
- 个股盈亏柱状图
- 月度入金出金柱状图
- 交易次数统计
- 个股买卖点图

#### 前端技术

- ECharts 或 Recharts
- 图表组件封装
- 日期范围筛选
- 数据聚合

---

### 10.9 行情数据模块

#### 功能说明

后端统一接入第三方股票行情 API，用于获取当前价格和历史价格。

#### 接口设计

```txt
GET /market/quote/:symbol
GET /market/history/:symbol
```

#### 设计原则

- API Key 不放前端
- 后端统一请求行情服务
- 支持缓存
- 支持失败降级
- 行情失败时使用最近一次价格

#### 后续可扩展

- 每日定时同步价格
- 保存历史价格
- 支持多市场股票

---

### 10.10 股票资讯与 AI 总结

#### 功能说明

展示持仓股票相关新闻，并支持 AI 总结近期事件。

#### 页面功能

- 查看持仓股票相关新闻
- 查看公司公告或财报摘要
- 点击生成 AI 总结
- 展示利好因素、利空因素、风险点、关注事项

#### 接口设计

```txt
GET /stocks/:symbol/news
POST /ai/stock-summary
```

#### AI 返回结构

```json
{
  "summary": "近期 AMD 的主要关注点是...",
  "positiveFactors": [],
  "negativeFactors": [],
  "riskPoints": [],
  "watchItems": []
}
```

#### 产品提示

页面需要明确展示：

> 本功能仅用于信息整理，不构成投资建议。

---

### 10.11 登录鉴权模块

#### 功能说明

为了使项目更完整，后期加入用户系统。

#### 功能

- 注册
- 登录
- 获取当前用户信息
- JWT 鉴权
- 用户数据隔离

#### 接口设计

```txt
POST /auth/register
POST /auth/login
GET /auth/me
```

#### 数据隔离

以下数据需要绑定 userId：

- Trade
- CashFlow
- Watchlist
- ImportJob
- ImportRecord

---

## 11. 数据库核心模型建议

第一阶段只需要：

```txt
Trade
CashFlow
```

第二阶段增加：

```txt
ImportJob
ImportRecord
```

第三阶段增加：

```txt
User
Stock
StockNews
AiSummary
Watchlist
PositionSnapshot
```

---

## 12. 推荐开发阶段

### 阶段 1：交易记录 CRUD

#### 目标

完成手动新增、编辑、删除、查询交易记录。

#### 学习重点

- NestJS Controller
- Service
- DTO
- Prisma
- PostgreSQL
- React 表单
- React 表格
- 前后端联调

---

### 阶段 2：搜索、筛选、分页

#### 目标

增强交易记录列表。

#### 功能

- 股票代码搜索
- 交易类型筛选
- 日期范围筛选
- 分页
- 排序

#### 学习重点

- Query 参数
- Prisma where 条件拼接
- 分页查询
- 前端 Table 查询联动

---

### 阶段 3：IBKR 邮件样本解析

#### 目标

先不连接邮箱，只解析本地邮件文本样本。

#### 功能

- 粘贴邮件正文
- 解析交易记录
- 展示解析结果
- 展示解析失败字段

#### 学习重点

- 文本解析
- HTML 解析
- 正则表达式
- 日期处理
- 金额处理
- 单元测试

---

### 阶段 4：邮件导入预览与确认

#### 目标

将解析结果通过预览确认后写入数据库。

#### 功能

- 导入预览
- 确认导入
- 重复检查
- 导入统计
- 导入日志

#### 学习重点

- 幂等性
- sourceHash 去重
- 唯一索引
- 导入日志
- 错误处理

---

### 阶段 5：持仓收益计算

#### 目标

根据交易记录计算当前持仓和收益。

#### 功能

- 当前持仓
- 平均成本
- 已实现盈亏
- 未实现盈亏
- 总收益率

#### 学习重点

- 移动平均成本法
- 数据聚合
- 业务规则抽象
- Decimal 精度

---

### 阶段 6：资金流水与资产统计

#### 目标

加入入金、出金、现金余额和总资产计算。

#### 功能

- 资金流水 CRUD
- 总入金
- 总出金
- 净入金
- 现金余额
- 总资产
- 实际收益

#### 学习重点

- 财务数据建模
- 多币种字段设计
- 资产汇总

---

### 阶段 7：图表分析

#### 目标

通过图表展示资产和收益变化。

#### 功能

- 资产曲线
- 持仓占比
- 个股盈亏
- 入金出金统计

#### 学习重点

- ECharts
- 图表封装
- 数据可视化
- 前端性能优化

---

### 阶段 8：行情数据接入

#### 目标

接入第三方股票行情 API。

#### 功能

- 当前价格
- 历史价格
- 行情缓存
- 失败降级

#### 学习重点

- 第三方 API
- 环境变量
- 缓存
- 定时任务

---

### 阶段 9：股票资讯与 AI 总结

#### 目标

展示持仓股票新闻，并用 AI 做摘要。

#### 功能

- 新闻列表
- AI 总结
- 利好利空分析
- 风险点提示

#### 学习重点

- AI API
- Prompt 设计
- 结构化 JSON 输出
- AI 结果缓存

---

### 阶段 10：IBKR Flex Query 自动同步

#### 目标

升级为正式数据源同步。

#### 功能

- 配置 Flex Query
- 后端拉取 XML / CSV
- 解析交易与资金流水
- 定时同步
- 同步日志

#### 学习重点

- 外部系统集成
- XML / CSV 解析
- 定时任务
- Token 管理
- 同步失败重试

---

### 阶段 11：登录鉴权与部署

#### 目标

完成项目工程化和上线。

#### 功能

- JWT 登录鉴权
- 用户数据隔离
- Docker 部署
- Swagger 文档
- README
- 环境变量管理

---

## 13. Codex 开发提示词模板

### 13.1 第一阶段提示词

```txt
我想做一个个人股票投资记录与分析系统，项目名 TradePilot，用来学习后端能力。

我的背景：
- 5 年前端开发
- 熟悉 React / Vue / TypeScript
- 后端基础较弱
- 希望边写边学

技术栈：
- 前端 React + TypeScript + Vite
- 后端 NestJS
- 数据库 PostgreSQL
- ORM Prisma

现在只做第一阶段：交易记录 CRUD。
不要加入登录、AI、行情 API、复杂收益计算。

请你帮我：
1. 设计第一阶段的项目目录
2. 设计 Trade 数据表
3. 生成后端 CRUD 接口
4. 生成前端交易记录列表和新增表单
5. 在关键代码处加注释，解释后端概念
6. 提供 curl 测试命令
7. 最后告诉我这一阶段应该重点学习哪些知识
```

### 13.2 IBKR 邮件解析提示词

```txt
我正在做 TradePilot 个人股票投资记录与分析系统。

现在我要新增 IBKR 邮件解析模块，但不要直接连接邮箱。
请先基于本地 samples/ibkr-email.txt 做解析。

要求：
1. 新建 parseIbkrEmail(content: string): TradeImportItem[] 方法
2. 解析出 symbol、type、quantity、price、fee、currency、tradeDate
3. 输出统一数据结构
4. 对解析失败的字段给出错误信息
5. 为 parser 编写单元测试
6. 不要写入数据库
7. 解释每个字段如何从邮件中提取
```

### 13.3 导入预览提示词

```txt
现在 parser 已经可以解析本地 IBKR 邮件样本。

请新增导入预览接口：
POST /imports/ibkr-email/preview

要求：
1. 接收邮件正文 content
2. 调用 parseIbkrEmail
3. 返回解析出的交易记录
4. 返回无法解析的错误列表
5. 不要写入数据库
```

### 13.4 确认导入提示词

```txt
现在新增确认导入接口：
POST /imports/ibkr-email/confirm

要求：
1. 接收 preview 返回的交易记录
2. 为每条记录生成 sourceHash
3. 检查是否已经导入过
4. 未重复的写入 Trade 表
5. 重复的标记为 DUPLICATE
6. 返回导入结果统计
7. 生成 ImportJob 和 ImportRecord 记录
```

---

## 14. 简历描述参考

### 基础版

> 基于 React + TypeScript + NestJS + PostgreSQL 开发个人投资组合分析平台 TradePilot，支持交易记录、资金流水、持仓聚合、收益计算和资产可视化分析。后端使用 Prisma 进行数据建模，通过移动平均成本法计算持仓成本、已实现盈亏和未实现盈亏，前端基于 ECharts 展示资产曲线、持仓占比和个股盈亏。

### 加入 IBKR 邮件导入版

> 设计并实现 IBKR 邮件交易确认解析模块，支持邮件正文解析、交易记录预览、确认导入、sourceHash 去重和导入日志追踪，提升交易数据录入效率并保证导入过程的幂等性和可追踪性。

### 加入 AI 版

> 接入大模型 API 对持仓股票相关新闻进行结构化摘要，生成利好因素、风险点和关注事项，辅助用户进行投资复盘。AI 总结结果仅用于信息整理，不构成投资建议。