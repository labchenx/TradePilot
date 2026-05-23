# Current Stage：Auth 用户系统与数据隔离开发

## 1. 当前阶段目标

本阶段目标是为 TradePilot 新增 **Auth 用户系统与数据隔离能力**。

当前项目已经完成多个核心业务页面：

- Overview 首页
- Holdings 当前持仓
- Transactions 交易明细
- Cash Flows 现金流水
- Analytics / Performance 收益分析页
- Trading Behavior 交易行为分析页
- IBKR CSV Imports 数据导入页

随着系统已经支持数据导入、清空数据、重新导入、行情配置、快照生成和资产计算，下一步需要加入用户系统，确保每个用户只能访问和管理自己的数据。

本阶段重点：

```text
注册
登录
退出登录
获取当前用户
JWT 鉴权
用户数据隔离
前端路由保护
现有数据迁移到默认用户
```

---

## 2. 为什么本阶段要做 Auth

当前系统已经涉及大量用户私有数据：

```text
交易记录
现金流水
公司行动
导入历史
导入详情
持仓快照
月度资产快照
symbol 映射
用户设置
数据清空
重新导入
```

如果没有用户系统，后续这些功能都会缺少数据归属：

```text
清空数据到底清空谁的数据？
重新导入导入到谁的账户？
导入历史属于谁？
symbol 映射规则属于谁？
设置页保存的是谁的配置？
```

因此在继续开发 Settings、行情配置、AI 总结、部署之前，需要先补上用户系统和 userId 数据隔离。

---

## 3. 本阶段功能范围

### 3.1 本阶段要做

```text
用户注册
用户登录
退出登录
获取当前用户
JWT 鉴权
业务接口鉴权保护
业务数据绑定 userId
前端登录页
前端注册页
前端路由保护
API 请求自动携带 token
现有旧数据迁移到默认用户
```

### 3.2 本阶段不做

```text
邮箱验证
忘记密码
第三方登录
角色权限系统
团队协作
订阅付费
多账户权限管理
复杂 OAuth
```

第一版只做单用户维度的数据隔离即可。

---

## 4. 页面路由

建议新增：

```text
/login
/register
```

登录成功后跳转：

```text
/dashboard
```

退出登录后跳转：

```text
/login
```

需要登录保护的页面：

```text
/dashboard
/holdings
/transactions
/cash-flows
/analytics
/trading-behavior
/imports
/settings
```

如果当前项目使用 `/` 作为首页，也需要根据现有路由适配。

---

## 5. 后端数据模型

### 5.1 新增 User 模型

建议字段：

```ts
User {
  id
  email
  passwordHash
  name?
  createdAt
  updatedAt
}
```

要求：

- email 唯一
- passwordHash 不能明文存储
- name 可选
- createdAt / updatedAt 自动维护

### 5.2 业务表增加 userId

需要给以下表增加 userId：

```text
trades / transactions
cash_flows
corporate_actions
import_jobs
import_records
portfolio_monthly_snapshots
position_monthly_snapshots
symbol_mappings
user_settings
```

如果当前项目还有其它用户私有业务表，也需要补上 userId。

### 5.3 price_history 是否需要 userId

如果 `price_history` 是公共行情缓存：

```text
symbol
date
close
adjustedClose
source
```

则可以不绑定 userId。

如果当前项目的 `price_history` 设计为用户导入派生数据，则需要绑定 userId。

推荐策略：

```text
price_history 作为公共行情缓存，不绑定 userId
snapshot / import / trade / cashflow / setting 绑定 userId
```

---

## 6. 后端 Auth 接口

建议新增接口：

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout
```

### 6.1 POST /api/auth/register

请求：

```ts
{
  email: string;
  password: string;
  name?: string;
}
```

处理逻辑：

```text
校验 email 格式
校验 password 长度
检查 email 是否已存在
使用 bcrypt 加密密码
创建 User
生成 JWT token
返回 user 基本信息和 token
```

返回：

```ts
{
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
}
```

### 6.2 POST /api/auth/login

请求：

```ts
{
  email: string;
  password: string;
}
```

处理逻辑：

```text
根据 email 查找用户
校验密码
校验失败返回统一错误
校验成功生成 JWT token
返回 user 和 token
```

安全要求：

```text
登录失败不要区分“邮箱不存在”和“密码错误”
统一返回“邮箱或密码错误”
```

### 6.3 GET /api/auth/me

处理逻辑：

```text
从 Authorization Bearer token 中解析用户
查询当前用户
返回用户基本信息
```

### 6.4 POST /api/auth/logout

如果使用前端存储 token：

```text
后端可以返回 success
前端负责清空 token
```

如果后续改为 HttpOnly Cookie，再扩展清除 cookie 逻辑。

---

## 7. JWT 鉴权要求

### 7.1 JWT Payload

建议包含：

```ts
{
  sub: user.id,
  email: user.email
}
```

### 7.2 环境变量

JWT secret 必须使用环境变量：

```text
JWT_SECRET
JWT_EXPIRES_IN
```

不要把 secret 写死在代码中。

### 7.3 鉴权中间件 / Guard

所有业务接口都需要通过鉴权获取 currentUser。

没有 token：

```text
返回 401
```

token 无效或过期：

```text
返回 401
```

---

## 8. 业务数据隔离要求

所有业务接口查询数据时必须加 userId 条件：

```ts
where: {
  userId: currentUser.id
}
```

所有业务接口创建数据时必须写入：

```ts
userId: currentUser.id
```

所有业务接口更新 / 删除数据时必须确保记录属于当前用户：

```ts
where: {
  id,
  userId: currentUser.id
}
```

需要处理的模块包括：

```text
Overview / portfolio summary
Holdings / positions
Transactions
Cash Flows
Analytics
Trading Behavior
IBKR CSV Imports
Import History
Import Detail
Clear Data
Monthly Snapshots
Position Snapshots
Settings
Symbol Mappings
```

---

## 9. 清空数据接口调整

现有或后续的清空数据接口必须只清空当前用户数据。

建议接口：

```text
POST /api/portfolio/clear-data
```

要求：

```text
只删除 currentUser.id 下的数据
不能影响其它用户
不能清空公共 price_history
危险操作需要前端二次确认
```

清空范围：

```text
trades / transactions
cash_flows
corporate_actions
import_jobs
import_records
portfolio_monthly_snapshots
position_monthly_snapshots
symbol_mappings
user_settings
```

返回：

```ts
{
  success: true;
  deletedCounts: {
    trades: number;
    cashFlows: number;
    corporateActions: number;
    importJobs: number;
    importRecords: number;
    portfolioMonthlySnapshots: number;
    positionMonthlySnapshots: number;
  };
}
```

---

## 10. 前端 Auth 功能

### 10.1 Auth Service

建议新增：

```text
src/services/auth/
  auth-service.ts
  auth-types.ts
```

方法：

```ts
register(payload)
login(payload)
getCurrentUser()
logout()
```

### 10.2 Auth Store / Context

可以使用 Zustand 或 React Context。

状态：

```ts
user
token
isAuthenticated
isLoading
login()
register()
logout()
fetchMe()
```

Token 存储：

第一版可以用：

```text
localStorage
```

后续再升级为：

```text
HttpOnly Cookie
```

### 10.3 API 请求自动带 token

如果项目使用 axios，需要增加 interceptor：

```text
Authorization: Bearer <token>
```

如果 token 失效或接口返回 401：

```text
清空登录状态
跳转 /login
```

---

## 11. 前端页面要求

### 11.1 登录页 /login

字段：

```text
Email
Password
```

功能：

```text
登录
跳转注册页
错误提示
loading 状态
```

登录成功后：

```text
跳转 /dashboard
```

### 11.2 注册页 /register

字段：

```text
Name 可选
Email
Password
Confirm Password
```

功能：

```text
注册
跳转登录页
表单校验
错误提示
loading 状态
```

注册成功后推荐：

```text
自动登录并跳转 /dashboard
```

### 11.3 退出登录

在侧边栏或顶部导航增加：

```text
Logout / 退出登录
```

点击后：

```text
清空 token
清空 user
跳转 /login
```

### 11.4 路由保护

未登录访问业务页面时：

```text
跳转 /login
```

已登录访问 login / register 时：

```text
跳转 /dashboard
```

---

## 12. 现有数据迁移

如果当前数据库已有旧数据，需要迁移到默认用户下，避免加 userId 后旧数据丢失。

建议流程：

```text
创建默认用户
将现有 trades / cash_flows / imports / snapshots 等 userId 为空的数据更新为默认用户 id
新增 userId 非空约束
```

默认用户示例：

```text
email: demo@tradepilot.local
name: Demo User
```

密码可以在开发环境中设置为：

```text
TradePilot123
```

注意：

- 不要直接删除现有数据
- 迁移脚本需要有注释
- 如果开发环境允许重置数据库，可以在说明中明确
- 生产环境必须使用迁移脚本

---

## 13. UI 风格要求

登录 / 注册页面风格要和现有项目保持一致：

```text
简洁
白底卡片
圆角
轻阴影
金融数据产品风格
中英文可混排
错误提示清晰
```

可以使用已有按钮、输入框、卡片组件。

不要大改现有业务页面 UI，只需要加鉴权和用户入口。

---

## 14. 安全要求

必须满足：

```text
密码不能明文存储
使用 bcrypt 或同类库加密密码
JWT secret 使用环境变量
业务接口没有 token 返回 401
token 无效或过期返回 401
登录失败不要暴露具体原因
用户只能访问自己的数据
清空数据只能清空自己的数据
```

---

## 15. 建议目录结构

根据现有项目结构适配，建议：

```text
src/
  services/
    auth/
      auth-service.ts
      auth-types.ts
  stores/
    auth-store.ts
  components/
    auth/
      ProtectedRoute.tsx
  pages/
    login/
    register/
```

如果是 Next.js App Router：

```text
app/
  login/
    page.tsx
  register/
    page.tsx
```

后端建议：

```text
src/
  auth/
    auth.controller.ts
    auth.service.ts
    auth.module.ts
    jwt.strategy.ts
    jwt-auth.guard.ts
    dto/
      login.dto.ts
      register.dto.ts
  users/
    users.service.ts
    users.module.ts
```

---

## 16. 验收标准

完成后需要满足：

1. 用户可以注册
2. 用户可以登录
3. 用户可以退出登录
4. 用户可以获取当前登录用户
5. 密码加密存储
6. JWT secret 使用环境变量
7. 未登录访问业务页面会跳转 /login
8. 登录成功后跳转 /dashboard
9. API 请求会自动携带 Authorization token
10. token 无效或过期时返回 401 并跳转登录
11. 所有业务数据绑定 userId
12. 所有业务接口只能读取当前用户数据
13. 所有业务接口只能修改当前用户数据
14. 清空数据只能清空当前用户数据
15. 现有旧数据迁移到默认用户，或者提供清晰的开发环境重置说明
16. 不影响已完成的业务页面功能
17. 不做邮箱验证、忘记密码、第三方登录和角色系统