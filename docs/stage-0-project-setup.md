# 当前阶段

## 当前阶段

Stage 0：项目初始化

---

## 当前目标

搭建基础的 monorepo 或前后端分离项目结构。

当前阶段的重点不是实现业务功能，而是先把前端、后端、数据库和基础开发环境跑通。

---

## 允许做的事情

- 创建 React + TypeScript + Vite 前端应用
- 创建 NestJS 后端应用
- 配置 PostgreSQL
- 配置 Prisma
- 添加健康检查 API
- 添加基础 README
- 添加 `.env.example`
- 添加基础项目目录结构
- 添加基础开发命令说明

---

## 暂时不允许做的事情

- 不要实现交易记录 CRUD
- 不要实现 IBKR 邮件导入
- 不要实现登录
- 不要实现 AI
- 不要实现行情数据
- 不要实现 Dashboard 图表
- 不要实现资金流水
- 不要实现持仓计算
- 不要实现复杂权限系统
- 不要引入复杂微服务架构

---

## 当前阶段推荐目录结构

可以使用 monorepo 结构：

```txt
tradepilot/
  apps/
    web/        # React 前端
    api/        # NestJS 后端
  docs/
    product-requirements.md
    development-roadmap.md
    current-stage.md
  .agents/
    rules/
      tradepilot.md
  README.md
  .env.example
```

也可以使用前后端分离结构：

```txt
tradepilot/
  frontend/     # React 前端
  backend/      # NestJS 后端
  docs/
  .agents/
  README.md
  .env.example
```

如果没有特殊原因，优先使用结构清晰、容易理解的方案，不要过度复杂化。

---

## 后端当前阶段要求

后端只需要完成：

- NestJS 项目可启动
- Prisma 可初始化
- PostgreSQL 可连接
- 提供健康检查接口

健康检查接口：

```txt
GET /health
```

期望返回：

```json
{
  "status": "ok"
}
```

---

## 前端当前阶段要求

前端只需要完成：

- React + TypeScript + Vite 项目可启动
- 显示一个简单首页
- 首页可以展示项目名 TradePilot
- 可以预留后续 Layout 和路由结构，但不要实现完整页面

首页可以显示：

```txt
TradePilot
Personal Portfolio Tracker
```

---

## 环境变量要求

需要提供 `.env.example`，但不要提交真实密钥。

示例：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tradepilot"

# 后续阶段使用
JWT_SECRET=""
MARKET_DATA_API_KEY=""
AI_API_KEY=""
```

---

## 完成标准

当前阶段完成时，需要满足：

- 前端可以成功启动
- 后端可以成功启动
- PostgreSQL 可以成功连接
- Prisma 可以正常初始化
- `GET /health` 返回 `{ "status": "ok" }`
- README 中有基本启动说明
- `.env.example` 已创建
- 没有实现阶段外业务功能

---

## 验证方式

后端启动后，可以使用：

```bash
curl http://localhost:3000/health
```

预期结果：

```json
{
  "status": "ok"
}
```

前端启动后，浏览器访问前端地址，应看到 TradePilot 项目名称。

---

## 本阶段学习重点

用户应重点理解：

- 前后端项目如何分离
- NestJS 项目入口在哪里
- Controller 和 Service 的基本概念
- `.env` 环境变量的作用
- Prisma 如何连接 PostgreSQL
- 为什么要先做 health check
- 为什么不要一开始就实现完整业务功能

---

## 阶段完成后的下一步

完成 Stage 0 后，进入：

Stage 1：交易记录 CRUD

Stage 1 的目标是实现：

- Trade 数据表
- 交易记录新增
- 交易记录列表
- 交易记录详情
- 交易记录编辑
- 交易记录删除
- 前端交易记录页面
- curl 测试命令
