# TradePilot

TradePilot 是一个个人股票投资组合记录与分析平台。本项目用于学习 React、NestJS、PostgreSQL、Prisma 等全栈开发能力。

当前阶段：**Stage 0 - 项目初始化**。

本阶段只负责搭建基础项目结构和开发环境，不包含交易记录 CRUD、IBKR 邮件导入、登录、AI、行情数据、资金流水、持仓计算或 Dashboard 图表。

## 项目结构

```txt
TradePilot/
  apps/
    web/        # React + TypeScript + Vite 前端
    api/        # NestJS + Prisma 后端
  docs/
  docker-compose.yml
  .env.example
  package.json
  pnpm-workspace.yaml
```

## 环境要求

- Node.js 22+
- pnpm
- Docker Desktop

如果本机还没有安装 pnpm，可以先执行：

```bash
npm install -g pnpm
```

## 启动步骤

安装依赖：

```bash
pnpm install
```

根据示例创建后端本地环境变量文件：

```bash
copy .env.example apps\api\.env
```

启动 PostgreSQL：

```bash
pnpm db:up
```

校验 Prisma 配置：

```bash
pnpm --filter api prisma validate
```

启动后端：

```bash
pnpm --filter api start:dev
```

另开一个终端启动前端：

```bash
pnpm --filter web dev
```

## 后端健康检查

后端启动后，验证当前 Stage 0 唯一 API：

```bash
curl http://localhost:3000/health
```

预期返回：

```json
{
  "status": "ok"
}
```

## 前端验证

打开前端 dev server 输出的 Vite 地址，页面应显示：

```txt
TradePilot
Personal Portfolio Tracker
```

## Stage 0 学习重点

- monorepo 可以把前端和后端放在同一个仓库中，同时保持清晰的应用边界。
- NestJS 从 `main.ts` 启动，通过 Module 组织功能，通过 Controller 暴露 HTTP 接口。
- health check 是后端最小可验证接口，用于确认服务可以正常启动并响应请求。
- `.env.example` 用于记录项目需要哪些环境变量，但不提交真实密钥。
- Prisma 通过 `DATABASE_URL` 读取数据库连接，并通过 `schema.prisma` 描述数据库配置。
- PostgreSQL 作为独立服务运行，后端通过连接字符串访问数据库。
