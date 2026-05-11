# TradePilot Figma UI Requirements

## 1. 文档用途

本文档用于指导 Codex 在现有 Figma Make 生成的 TradePilot 前端 UI 基础上继续开发。

当前项目已经通过 Figma Make 生成了一套 React + Vite + TypeScript + Tailwind 风格的前端界面。后续开发不应重新设计 UI，而应在现有视觉体系、组件结构和页面风格基础上继续扩展。

本文档重点说明：

- 当前 UI 的视觉风格
- 当前项目结构
- 页面布局规则
- 组件使用规则
- 颜色与状态规范
- 后续页面扩展规范
- Codex 在接入后端和新增功能时需要遵守的 UI 约束

---

## 2. 当前 UI 总体风格

当前 TradePilot UI 风格为：

> Minimal Professional Fintech SaaS Dashboard  
> 极简专业金融 SaaS 数据后台

核心气质：

- 专业
- 克制
- 清爽
- 数据优先
- 金融科技感
- 适合桌面端后台系统
- 支持浅色 / 深色主题
- 不偏加密货币风
- 不偏霓虹科技风
- 不偏营销官网风

当前 UI 更接近：

- Linear 风格的极简产品后台
- Vercel Dashboard 的清爽布局
- 金融数据分析工具的表格和图表布局
- Bloomberg-lite 的数据密度，但不是深色终端风

---

## 3. 当前技术栈

Figma Make 生成的前端代码主要使用：

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Recharts
- lucide-react
- clsx
- tailwind-merge
- next-themes 风格的主题切换逻辑
- 部分 shadcn/ui / Radix UI 风格组件

当前 UI 中不建议额外引入新的大型 UI 库，除非明确需要。

---

## 4. 当前项目结构

当前 Figma Make 生成的主要文件结构类似：

```txt
src/
  app/
    App.tsx
    routes.tsx
    components/
      Layout.tsx
      theme-provider.tsx
      ui.tsx
      ui/
        button.tsx
        input.tsx
        card.tsx
        table.tsx
        dialog.tsx
        ...
    pages/
      Dashboard.tsx
      Trades.tsx
      Import.tsx
      CashFlows.tsx
      Positions.tsx
      StockDetail.tsx
      News.tsx
      Settings.tsx
      Login.tsx
  styles/
    index.css
    tailwind.css
    theme.css
    fonts.css
```

后续开发应尽量保持类似结构。

如果需要重构，可以逐步整理为：

```txt
src/
  app/
    App.tsx
    routes.tsx
  layouts/
    AppLayout.tsx
    Sidebar.tsx
    Topbar.tsx
  pages/
    dashboard/
    trades/
    imports/
    cash-flows/
    positions/
    stocks/
    news/
    settings/
    login/
  components/
    common/
    ui/
    charts/
    tables/
  mocks/
  services/
    api/
  types/
  utils/
  styles/
```

不要一次性大规模重构，除非当前阶段明确要求。

---

## 5. 当前路由结构

当前 Figma Make 代码中使用 React Router。

当前路由包括：

```txt
/
trades
import
cash-flows
positions
stock/:symbol
news
settings
login
```

建议后续统一为：

```txt
/
dashboard
/trades
/imports
/cash-flows
/positions
/stocks/:symbol
/news
/settings
/login
```

说明：

- `/` 可以重定向到 `/dashboard`，或者直接作为 Dashboard 页面。
- 建议将 `/import` 改为 `/imports`，方便后续扩展 `/imports/history`、`/imports/:id`。
- 建议将 `/stock/:symbol` 改为 `/stocks/:symbol`，保持 RESTful 风格一致。

如果暂时不想改动，也可以先保留现有路由，但文档、页面按钮和后端 API 命名应逐步统一。

---

## 6. 全局布局规则

当前 UI 使用 `AppLayout` 承载主应用结构。

布局特征：

```txt
左侧 72px 折叠 Sidebar
右侧主内容区
顶部固定 Header / Topbar
主内容区滚动
支持浅色 / 深色主题切换
```

当前 Layout 结构：

```txt
App
  ThemeProvider
    RouterProvider
      AppLayout
        Sidebar
        Header
        Page Content
```

### 6.1 Sidebar

当前 Sidebar 特点：

- 宽度约 72px
- 图标优先
- hover 时显示 tooltip
- Logo 使用黑白 T 字母块
- 导航使用 lucide-react 图标
- 底部包含用户入口和退出按钮
- 深色模式下背景接近 `#111111`
- 浅色模式下背景为白色

当前导航项：

```txt
Dashboard / 投资总览
Trades / 交易记录
Import IBKR / 邮件导入
Cash Flows / 资金流水
Positions / 当前持仓
News & AI / 股票资讯
Settings / 设置
```

后续新增页面时，应保持同样的导航视觉，不要把 Sidebar 改成营销站风格。

### 6.2 Topbar / Header

当前 Header 特点：

- 高度约 64px
- 左侧显示当前页面标题
- 右侧显示同步状态、主题切换按钮
- 背景使用半透明白色 / 深色，并带 backdrop blur
- 底部有细边框

后续可以扩展：

- 搜索框
- 通知入口
- 用户菜单
- 当前数据源状态
- 当前账户选择

但早期不要加入复杂真实逻辑，只做 UI 占位即可。

### 6.3 主内容区

当前主内容区：

```txt
padding: 32px
overflow-y-auto
页面内容使用 space-y-6
卡片使用 rounded-xl + border + shadow-sm
```

后续页面应保持：

- 页面最大信息宽度清晰
- 图表和表格分区明确
- 不要过度使用大渐变背景
- 不要做全屏营销式 hero 区
- 不要把金融数据卡片做得像广告 banner

---

## 7. 主题与颜色规范

当前 UI 通过 CSS 变量和 Tailwind dark class 支持主题切换。

主要文件：

```txt
src/styles/theme.css
src/app/components/theme-provider.tsx
```

### 7.1 基础色彩方向

浅色模式：

```txt
页面背景：neutral-50 / #FAFAFA 附近
卡片背景：white
文字主色：neutral-900
文字次级：neutral-500 / neutral-600
边框：neutral-200
```

深色模式：

```txt
页面背景：#0a0a0a
卡片背景：neutral-900 / #111111
文字主色：white / neutral-100
文字次级：neutral-400
边框：neutral-800
```

### 7.2 业务状态色

后续开发必须保持这些业务颜色一致：

```txt
盈利 / BUY / 成功：green
亏损 / SELL / 删除 / 错误：red
链接 / 主强调 / 当前步骤：blue
警告 / 重复记录：yellow / amber
普通状态 / 手动来源 / 中性：gray / neutral
```

示例：

```txt
BUY：绿色 Tag
SELL：红色 Tag
EMAIL：蓝色 Tag
MANUAL：灰色 Tag
SUCCESS：绿色
WARNING / DUPLICATE：黄色
ERROR / FAILED：红色
```

### 7.3 不要使用的风格

避免：

- 霓虹色
- 大面积渐变
- 高饱和 Web3 色彩
- 彩虹图表
- 玻璃拟态过度叠加
- 3D 插画
- 营销落地页风格

---

## 8. 字体与数字规范

当前 UI 使用现代无衬线字体和 Tailwind 默认排版风格。

金融数据展示要求：

- 金额、数量、价格、百分比使用 `tabular-nums`
- 金额保留 2 位小数
- 百分比通常保留 2 位小数
- 股票代码使用加粗或半加粗
- 公司名称使用次级文字
- 表格中的数字列右对齐
- 日期使用统一格式，如 `YYYY-MM-DD`

示例：

```tsx
<td className="text-right tabular-nums font-medium">
  $8,260.00
</td>
```

---

## 9. 当前基础组件规范

当前 `src/app/components/ui.tsx` 中已有轻量组件：

```txt
cn
StatCard
ProfitLossNumber
Tag
Button
Input
```

后续开发应优先复用这些组件，而不是每个页面重新写一套样式。

### 9.1 StatCard

用于 Dashboard、Cash Flows、Positions 等顶部统计卡片。

视觉规则：

- 白色 / 深色卡片背景
- `rounded-xl`
- `border`
- `shadow-sm`
- 标题为小号次级文字
- 数值为 2xl 加粗
- 盈亏使用 `ProfitLossNumber`

适用场景：

```txt
Total Assets
Market Value
Cash Balance
Net Deposit
Total P/L
Return Rate
Total Deposit
Total Withdraw
Unrealized P/L
```

### 9.2 ProfitLossNumber

用于统一展示盈亏金额。

规则：

- 正数：绿色，并显示 `+`
- 负数：红色，并显示 `-`
- 0：中性色
- 支持百分比
- 使用 `tabular-nums`

### 9.3 Tag

用于展示短状态。

建议状态映射：

```txt
BUY -> green
SELL -> red
EMAIL -> blue
MANUAL -> gray
SUCCESS -> green
DUPLICATE -> yellow
FAILED -> red
PENDING -> blue
```

### 9.4 Button

当前 Button 支持：

```txt
primary
secondary
outline
danger
ghost
```

使用规则：

- 主要操作用 primary
- 次要操作用 outline 或 secondary
- 删除、失败、危险操作用 danger
- 表格轻量操作用 ghost 或文本按钮
- 不要过度使用彩色按钮

### 9.5 Input

当前 Input 使用：

- 高度 36px / 40px
- 圆角 md
- 细边框
- focus ring
- 支持深色模式

表单字段应尽量复用 Input。

---

## 10. 页面级设计规范

## 10.1 Dashboard 页面

当前 Dashboard 已经包含：

- 顶部 6 个统计卡片
- Asset Trend 折线 / 面积图
- Allocation 环形图
- Recent Trades
- Positions 预览
- Import Status

后续接真实 API 时，不要改变页面整体布局。

保留结构：

```txt
第一行：6 个统计卡片
第二行：左侧 Asset Trend，右侧 Allocation
第三行：Positions / Recent Trades / Import Status
```

Dashboard 数据应来自后端聚合接口，而不是页面内手动计算。

建议未来接口：

```txt
GET /portfolio/summary
GET /portfolio/performance
GET /positions
GET /trades/recent
GET /imports/recent
```

## 10.2 Trades 页面

当前 Trades 页面风格较成熟，应作为后续表格页面的模板。

已有结构：

```txt
页面标题 + 描述
右侧按钮：Import from IBKR、Add Trade
筛选条
交易记录表格
分页
```

后续接后端时保持：

- 表格密度
- 筛选区样式
- BUY / SELL tag
- EMAIL / MANUAL source tag
- 数字右对齐
- hover 行高亮
- 分页在底部

不要在表格中塞过多视觉装饰。

## 10.3 Import 页面

当前 Import 页面是项目亮点，应保留流程型设计。

已有流程：

```txt
Paste Email
Preview Parsed Trades
Confirm Import
Import Result
```

保留 Stepper 风格。

Import 页面应体现：

- 先预览
- 再确认
- 不直接写入数据库
- 成功、重复、失败状态清晰
- 错误信息可追踪

状态颜色：

```txt
Ready / Success -> green
Warning / Duplicate -> yellow
Error / Failed -> red
```

## 10.4 Cash Flows 页面

当前 Cash Flows 页面与 Trades 类似，顶部使用统计卡片，下面是筛选和表格。

后续应保持：

- 入金为绿色
- 出金为红色
- 分红可用蓝色或绿色
- 费用 / 税费可用红色或黄色
- 金额右对齐
- 现金流水类型使用 Tag

## 10.5 Positions 页面

Positions 页面应强调：

- 当前持仓
- 平均成本
- 市值
- 未实现盈亏
- 收益率

后续接真实数据时：

- 股票代码加粗
- 公司名次级文字
- 盈亏金额使用 ProfitLossNumber
- 收益率使用绿色 / 红色
- 表格数字右对齐
- 图表保持简洁

## 10.6 Stock Detail 页面

Stock Detail 页面适合展示：

- 股票信息
- 当前价格
- 持仓数量
- 平均成本
- 未实现盈亏
- 价格趋势
- 买卖点
- 交易历史
- 新闻
- AI Summary

AI 区域必须显示免责声明：

```txt
AI summary is for information organization only and does not constitute investment advice.
```

不要生成“买入建议”“卖出建议”“目标价建议”等内容。

## 10.7 News 页面

News 页面应保持资讯聚合和 AI 摘要定位。

页面不应表现为荐股工具。

AI Summary 输出建议分组：

```txt
Overall Summary
Positive Factors
Negative Factors
Risk Points
Watch Items
```

必须带免责声明。

## 10.8 Settings 页面

Settings 页面应使用分组卡片：

```txt
Profile
Broker Settings
Import Rules
API Status
Display Preferences
```

不要展示真实 API Key。

只显示：

```txt
Connected
Not Connected
Last Sync
Enabled
Disabled
```

## 10.9 Login 页面

当前 Login 页面为左右分栏：

- 左侧品牌介绍
- 右侧登录表单
- 桌面端显示品牌图片
- 移动端隐藏左侧

后续实现真实登录时，应保持现有视觉，不要改成普通白板登录页。

---

## 11. 表格设计规则

TradePilot 是数据型产品，表格是核心。

所有数据表格应遵守：

- 表头使用小号大写或半大写次级文字
- 表格边框使用 neutral-200 / neutral-800
- 行 hover 使用浅灰背景
- 数字列右对齐
- 状态列居中或使用 Tag
- 操作列右对齐
- 日期列左对齐
- 股票代码加粗
- 公司名次级展示
- 分页在底部
- 支持 loading、empty、error 状态

推荐表格结构：

```txt
Card
  Filter Bar
  Table
  Pagination
```

不要把筛选区和表格拆得风格不一致。

---

## 12. 图表设计规则

当前图表使用 Recharts。

后续图表应保持：

- 简洁
- 少量颜色
- 不使用彩虹配色
- 网格线弱化
- Tooltip 使用深色背景
- 折线 / 面积图优先使用绿色或蓝色
- 环形图用于持仓占比
- 柱状图用于盈亏、入金出金统计

常用图表：

```txt
AreaChart -> 资产趋势
PieChart -> 持仓占比
BarChart -> 个股盈亏 / 月度资金流
LineChart -> 个股价格走势
```

图表容器应使用：

```txt
bg-white dark:bg-neutral-900
border border-neutral-200 dark:border-neutral-800
rounded-xl
shadow-sm
p-5 / p-6
```

---

## 13. Mock 数据规则

当前页面使用 mock 数据。

在接真实 API 之前，可以保留 mock 数据，但需要集中管理。

建议后续整理为：

```txt
src/mocks/
  dashboard.mock.ts
  trades.mock.ts
  imports.mock.ts
  cash-flows.mock.ts
  positions.mock.ts
  news.mock.ts
```

不要把大量 mock 数据长期散落在页面组件里。

当接入 API 后：

- 页面组件只负责渲染
- 数据请求放在 services/api 或 hooks 中
- mock 数据可以作为 fallback 或 Story 数据保留

---

## 14. 后续接后端时的 UI 约束

接入后端 API 时，Codex 必须遵守：

- 不要改变整体 UI 风格
- 不要重写整个页面
- 优先替换数据来源，而不是重构视觉
- 保留 loading、empty、error 状态
- 表单提交要有 disabled/loading 状态
- 删除操作要有确认
- 导入操作必须有 preview 和 confirm
- 金额和数量格式化要统一
- 后端字段变化时，应更新 types，而不是在 JSX 中随意适配

建议新增结构：

```txt
src/services/api/
  client.ts
  trades.api.ts
  imports.api.ts
  cashFlows.api.ts
  positions.api.ts
  portfolio.api.ts

src/hooks/
  useTrades.ts
  useImportPreview.ts
  usePositions.ts

src/types/
  trade.ts
  import.ts
  cash-flow.ts
  position.ts
  portfolio.ts
```

---

## 15. Codex 执行规则

当 Codex 处理前端 UI 相关任务时，应先阅读：

```txt
AGENTS.md
docs/current-stage.md
docs/product-requirements.md
docs/figma-ui-requirements.md
```

优先级：

```txt
1. docs/current-stage.md
2. AGENTS.md
3. docs/product-requirements.md
4. docs/figma-ui-requirements.md
```

`figma-ui-requirements.md` 用于约束视觉风格和组件结构，不代表当前阶段要实现所有页面功能。

如果当前阶段是 UI 初始化：

- 可以整理 Layout
- 可以整理路由
- 可以保留 mock 数据
- 可以创建基础组件

如果当前阶段是后端 CRUD：

- 不要重写 UI
- 只在需要时改动对应页面的数据接入

如果当前阶段是 Trades 接 API：

- 只改 Trades 页面和相关 API hook
- 不要改 Dashboard、Import、Positions 等无关页面

---

## 16. 给 Codex 的推荐 Prompt

```txt
请先阅读：
- AGENTS.md
- docs/current-stage.md
- docs/product-requirements.md
- docs/figma-ui-requirements.md

当前任务涉及前端 UI，请以 docs/figma-ui-requirements.md 中描述的现有 Figma Make UI 为准。

要求：
1. 不要重新设计 TradePilot UI。
2. 保留当前极简专业金融 SaaS 风格。
3. 保留浅色 / 深色主题切换。
4. 保留左侧 72px 折叠 Sidebar 与顶部 Header 的整体结构。
5. 优先复用已有组件：StatCard、ProfitLossNumber、Tag、Button、Input。
6. 页面布局使用 Tailwind flex/grid，不要使用绝对定位堆页面。
7. 不要引入阶段外业务功能。
8. 不要接入 current-stage.md 之外的 API。
9. 修改前先输出计划，说明会改哪些文件。
10. 修改后说明验证方式和下一步建议。
```

---

## 17. 当前 UI 的保留重点

后续任何重构都应尽量保留：

- 折叠 Sidebar + tooltip 导航
- Header 中的页面标题和 Sync 状态
- 主题切换
- `bg-white dark:bg-neutral-900` 卡片体系
- `border-neutral-200 dark:border-neutral-800` 边框体系
- `rounded-xl shadow-sm` 卡片风格
- `tabular-nums` 金融数字风格
- `ProfitLossNumber` 盈亏展示规则
- `Tag` 状态标签体系
- Recharts 图表风格
- Trades 页面表格密度
- Import 页面 Stepper 流程设计
- Login 页面左右分栏品牌表达

---

## 18. 当前阶段建议

如果当前项目刚从 Figma Make 迁移到正式开发，建议下一步执行：

```txt
Stage 0.5：前端 UI 整理与基础架构初始化
```

目标：

- 保留 Figma Make 当前视觉
- 清理和统一路由
- 整理 mock 数据
- 确认 Dashboard、Trades、Import 能正常运行
- 其他页面保持占位或静态 mock
- 不接真实后端 API

完成后再进入：

```txt
Stage 1：Trade 后端 CRUD
Stage 1.5：Trades 页面接真实 API
```
