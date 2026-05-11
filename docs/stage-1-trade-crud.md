# 当前阶段

## 当前阶段

Stage 1：交易记录 CRUD

---

## 当前目标

实现 TradePilot 的第一条核心业务链路：手动创建、查看、编辑、删除股票交易记录。

当前阶段的重点是打通：

前端表单
→ 后端 API
→ Prisma
→ PostgreSQL
→ 前端表格展示

---

## 允许做的事情

- 设计 Trade 数据表
- 创建 Prisma model
- 执行数据库 migration
- 实现 Trade CRUD API
- 创建 Trade DTO
- 添加基础参数校验
- 实现交易记录列表接口
- 实现新增交易记录接口
- 实现编辑交易记录接口
- 实现删除交易记录接口
- 创建前端 Trades 页面
- 创建交易记录表格
- 创建新增 / 编辑交易弹窗
- 使用 mock 数据或真实 API 联调
- 提供 curl 测试命令

---

## 暂时不允许做的事情

- 不要实现 IBKR 邮件导入
- 不要实现导入日志
- 不要实现 sourceHash 去重
- 不要实现持仓计算
- 不要实现资金流水
- 不要实现行情数据
- 不要实现 AI 总结
- 不要实现登录鉴权
- 不要实现 Dashboard 图表
- 不要引入复杂权限系统

---

## Trade 表字段建议

```txt
Trade
- id
- broker
- accountId
- symbol
- name
- type: BUY / SELL
- quantity
- price
- fee
- currency
- tradeDate
- source: MANUAL / EMAIL / FLEX_QUERY
- note
- createdAt
- updatedAt