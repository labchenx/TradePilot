# TradePilot Figma Make AI UI 生成需求文档

## 1. 给 Figma Make AI 的完整提示词

```txt
请帮我设计一个现代化的 Web 端个人投资组合记录与分析平台 UI，项目名叫 TradePilot。

产品定位：
TradePilot 是一个个人股票投资组合记录与分析平台，用于管理股票买入卖出记录、入金出金流水、当前持仓、收益统计、IBKR 邮件导入、股票资讯和 AI 摘要。它不是荐股软件，只用于记录、分析和复盘个人投资数据。

目标用户：
使用 IBKR 等券商进行股票交易的个人投资者。

设计风格：
- 现代、专业、清爽
- 偏金融科技 SaaS 风格
- 适合桌面端后台管理系统
- 数据卡片清晰、有层次
- 图表区域突出
- 页面整体要有专业投资分析工具的感觉
- 不要做成花哨的加密货币风格

推荐视觉风格：
- 左侧固定导航栏
- 顶部显示项目名、搜索框、用户信息、数据同步状态
- 主内容区域使用卡片布局
- 使用黑色、绿色、灰色作为主色调
- 盈利用绿色，亏损用红色
- 数字信息要突出显示
- 表格要清晰、适合大量交易数据展示
- 图表要简洁专业

需要生成以下页面：

1. Dashboard 投资总览页
2. Trades 交易记录页
3. Import IBKR 邮件导入页
4. Cash Flows 资金流水页
5. Positions 当前持仓页
6. Stock Detail 个股详情页
7. News & AI Summary 股票资讯与 AI 摘要页
8. Settings 设置页
9. Login 登录页

请生成一套完整的 Web App UI，不需要移动端。
```

---

## 2. 页面一：Dashboard 投资总览页

```txt
页面名称：Dashboard / 投资总览

页面目标：
让用户一进入系统就能看到当前投资组合的整体表现。

页面布局：
- 左侧导航栏
- 顶部工具栏
- 主内容区

主内容区包含：

1. 顶部统计卡片，一行 4 到 6 个：
   - Total Assets 总资产
   - Stock Market Value 股票市值
   - Cash Balance 现金余额
   - Net Deposit 净入金
   - Total P/L 总收益
   - Return Rate 收益率

2. 资产趋势图：
   - 折线图
   - 展示最近 6 个月资产变化
   - 支持时间范围切换：1M / 3M / 6M / 1Y / All

3. 持仓占比图：
   - 饼图或环形图
   - 展示 AMD、AAPL、TSLA、NVDA 等股票占比

4. 当前持仓 Top 表格：
   - Symbol
   - Shares
   - Avg Cost
   - Market Price
   - Market Value
   - Unrealized P/L
   - Return %

5. 最近交易记录：
   - Date
   - Symbol
   - Type
   - Quantity
   - Price
   - Amount

6. 数据同步状态卡片：
   - Last IBKR Email Import
   - Imported Records
   - Duplicates Skipped
   - Failed Records

视觉要求：
- 总收益为正时使用绿色
- 亏损时使用红色
- 统计卡片要突出金额数字
- 图表区域要宽敞
```

---

## 3. 页面二：Trades 交易记录页

```txt
页面名称：Trades / 交易记录

页面目标：
管理用户所有股票买入、卖出记录。

页面内容：

1. 页面标题区：
   - 标题：Trades
   - 副标题：Manage buy and sell records from manual input or IBKR email import
   - 右侧按钮：Add Trade、Import from IBKR Email

2. 筛选区：
   - Symbol 搜索框
   - Type 下拉框：BUY / SELL
   - Broker 下拉框：IBKR / Manual
   - Date Range 日期范围
   - Reset 按钮
   - Search 按钮

3. 交易记录表格：
   列包括：
   - Trade Date
   - Symbol
   - Name
   - Type
   - Quantity
   - Price
   - Fee
   - Currency
   - Amount
   - Source
   - Actions

4. 表格样式：
   - BUY 使用绿色标签
   - SELL 使用红色标签
   - EMAIL / MANUAL source 使用不同 tag
   - 支持分页

5. 新增 / 编辑交易弹窗：
   字段包括：
   - Symbol
   - Name
   - Type
   - Quantity
   - Price
   - Fee
   - Currency
   - Trade Date
   - Broker
   - Note

视觉要求：
- 表格清晰紧凑
- 筛选区像专业后台系统
- 操作按钮不要过多干扰阅读
```

---

## 4. 页面三：IBKR 邮件导入页

```txt
页面名称：IBKR Email Import / IBKR 邮件导入

页面目标：
让用户粘贴 IBKR 邮件正文或上传邮件文件，系统解析交易记录，并在确认后导入。

页面内容：

1. 页面标题区：
   - 标题：IBKR Email Import
   - 副标题：Parse IBKR trade confirmation emails and import trades safely

2. 步骤条：
   Step 1 Paste Email
   Step 2 Preview Parsed Trades
   Step 3 Confirm Import
   Step 4 Import Result

3. 邮件输入区域：
   - 大文本框：Paste IBKR email content here
   - 文件上传区域：Upload .txt or .html email file
   - 按钮：Parse Preview

4. 解析预览区域：
   展示解析出的交易表格：
   - Symbol
   - Type
   - Quantity
   - Price
   - Fee
   - Currency
   - Trade Date
   - Status

5. 异常提示区域：
   - Missing fee
   - Unknown currency
   - Failed to parse date
   - Duplicate record warning

6. 确认导入按钮：
   - Confirm Import
   - Cancel

7. 导入结果区域：
   - Total Records
   - Successfully Imported
   - Duplicates Skipped
   - Failed Records
   - View Import Log

视觉要求：
- 这个页面要体现“安全导入，不直接写库”的流程
- Stepper 要清晰
- 预览表格中成功、失败、重复状态要明显
- 重复记录用黄色 warning
- 失败记录用红色 error
```

---

## 5. 页面四：Cash Flows 资金流水页

```txt
页面名称：Cash Flows / 资金流水

页面目标：
记录和管理入金、出金、分红、税费、利息、换汇等资金变动。

页面内容：

1. 顶部统计卡片：
   - Total Deposit 总入金
   - Total Withdraw 总出金
   - Net Deposit 净入金
   - Cash Balance 现金余额

2. 操作按钮：
   - Add Cash Flow

3. 筛选区：
   - Type 下拉：DEPOSIT / WITHDRAW / DIVIDEND / TAX / FEE / FX
   - Currency 下拉：USD / HKD / SGD / CNY
   - Date Range

4. 资金流水表格：
   - Date
   - Type
   - Amount
   - Currency
   - Broker
   - Source
   - Note
   - Actions

5. 新增资金流水弹窗：
   - Type
   - Amount
   - Currency
   - Flow Date
   - Broker
   - Note

视觉要求：
- 入金用绿色
- 出金用红色
- 分红用蓝色
- 税费和费用用橙色或灰色
```

---

## 6. 页面五：Positions 当前持仓页

```txt
页面名称：Positions / 当前持仓

页面目标：
展示当前持有股票的数量、成本、市值和盈亏。

页面内容：

1. 顶部统计卡片：
   - Number of Holdings 持仓股票数量
   - Total Market Value 总市值
   - Total Cost 总成本
   - Unrealized P/L 未实现盈亏

2. 持仓表格：
   - Symbol
   - Name
   - Shares
   - Avg Cost
   - Market Price
   - Total Cost
   - Market Value
   - Unrealized P/L
   - Return %
   - Actions

3. 图表区域：
   - 持仓占比环形图
   - 个股盈亏柱状图

4. 点击某只股票进入 Stock Detail 页面。

视觉要求：
- 盈利为绿色，亏损为红色
- 持仓表格要突出 Market Value 和 P/L
- 图表和表格要上下结合
```

---

## 7. 页面六：Stock Detail 个股详情页

```txt
页面名称：Stock Detail / 个股详情

页面目标：
展示某一只股票的详细持仓、交易历史、收益表现和相关新闻。

页面示例：AMD Detail

页面内容：

1. 顶部股票信息：
   - Symbol: AMD
   - Company Name: Advanced Micro Devices
   - Current Price
   - Daily Change
   - Market Value
   - Holding Shares
   - Avg Cost
   - Unrealized P/L

2. 价格走势图：
   - 折线图
   - 时间范围：1M / 3M / 6M / 1Y

3. 买卖点标记：
   - 在价格图上标记买入点和卖出点

4. 个股交易记录表：
   - Date
   - Type
   - Quantity
   - Price
   - Fee
   - Amount

5. 股票新闻区域：
   - News title
   - Source
   - Published time
   - Summary

6. AI Summary 卡片：
   - Generate AI Summary 按钮
   - Summary
   - Positive Factors
   - Negative Factors
   - Risk Points
   - Watch Items

7. 风险提示：
   - AI summary is for information organization only and does not constitute investment advice.

视觉要求：
- 个股详情页要像专业股票分析页面
- 信息层次清楚
- AI Summary 区域要和普通新闻区域区分开
```

---

## 8. 页面七：News & AI Summary 股票资讯页

```txt
页面名称：News & AI Summary / 股票资讯与 AI 摘要

页面目标：
集中展示持仓股票相关新闻，并支持 AI 生成结构化摘要。

页面内容：

1. 顶部筛选区：
   - Symbol 下拉
   - News Source 下拉
   - Date Range
   - Search

2. 新闻列表：
   - Title
   - Source
   - Published Time
   - Related Symbol
   - Short Description

3. AI Summary Panel：
   - 选择多条新闻
   - Generate Summary 按钮
   - 输出结构：
     - Overall Summary
     - Positive Factors
     - Negative Factors
     - Risk Points
     - Watch Items

4. 免责声明：
   - This AI summary is for information organization only and does not constitute investment advice.

视觉要求：
- 新闻列表适合阅读
- AI 摘要结果用卡片分组展示
- 风险提示要明显但不打扰
```

---

## 9. 页面八：Settings 设置页

```txt
页面名称：Settings / 设置

页面目标：
管理券商账号、数据源、导入配置和系统偏好。

页面内容：

1. Profile 设置：
   - Name
   - Email

2. Broker 设置：
   - Broker: IBKR
   - Account Alias
   - Base Currency

3. Import 设置：
   - Email Import Enabled
   - Flex Query Enabled
   - Last Sync Time
   - Sync Frequency

4. API 设置：
   - Market Data API Status
   - News API Status
   - AI API Status

5. Display 设置：
   - Base Currency
   - Number Format
   - Date Format

视觉要求：
- 设置页要简洁
- 使用分组卡片
- 不要展示真实 API Key，只展示 connected / not connected 状态
```

---

## 10. 页面九：Login 登录页

```txt
页面名称：Login / 登录

页面目标：
用户登录 TradePilot。

页面内容：

1. 左侧品牌介绍：
   - TradePilot
   - Personal Portfolio Tracker
   - Track trades, analyze positions, import IBKR emails, and review your portfolio performance.

2. 右侧登录表单：
   - Email
   - Password
   - Login Button
   - Register Link

视觉要求：
- 简洁专业
- 金融科技风格
- 不要太花哨
```

---

## 11. 导航栏设计

```txt
Logo: TradePilot

导航菜单：
- Dashboard
- Trades
- Import IBKR Email
- Cash Flows
- Positions
- News & AI Summary
- Settings
```

导航栏底部：

```txt
Sync Status: Last import 2 hours ago
User Avatar
```

---

## 12. 组件设计要求

请为整个系统统一设计以下组件：

```txt
- Statistic Card 数据统计卡片
- Filter Bar 筛选条
- Data Table 数据表格
- Status Tag 状态标签
- Profit / Loss Number 盈亏数字组件
- Chart Card 图表卡片
- Import Stepper 导入步骤条
- AI Summary Card AI 摘要卡片
- Warning Alert 风险提示
- Empty State 空状态
- Loading State 加载状态
```

---

## 13. 示例数据

请在 UI 中使用模拟数据：

```txt
持仓股票：AMD、AAPL、TSLA、NVDA、MSFT
币种：USD
券商：IBKR
交易来源：MANUAL、EMAIL
交易类型：BUY、SELL
```

示例数值：

```txt
Total Assets: $48,320.52
Stock Market Value: $42,180.20
Cash Balance: $6,140.32
Net Deposit: $35,000.00
Total P/L: +$13,320.52
Return Rate: +38.06%
```

---

## 14. 重要设计限制

```txt
1. 不要设计成荐股软件。
2. 不要出现“买入建议”“卖出建议”“预测收益”等投资建议模块。
3. AI 功能只用于新闻信息整理和复盘。
4. 所有 AI 区域都需要有“不构成投资建议”的提示。
5. 页面应偏专业后台系统，而不是娱乐网站。
6. 优先桌面端，不需要移动端。
7. 表格和图表要清晰可读。
```

---

## 15. Figma Make AI 简短版提示词

如果 Figma Make AI 一次放不下完整文档，可以使用下面这个短版本：

```txt
请设计一个桌面端 Web App，项目名 TradePilot，是一个个人股票投资组合记录与分析平台。

核心功能：
1. Dashboard：展示总资产、股票市值、现金余额、净入金、总收益、收益率、资产曲线、持仓占比和最近交易。
2. Trades：交易记录管理，支持买入卖出记录、筛选、分页、新增编辑弹窗。
3. IBKR Email Import：支持粘贴 IBKR 邮件正文、解析预览、确认导入、显示重复和失败记录。
4. Cash Flows：管理入金、出金、分红、税费、换汇等资金流水。
5. Positions：展示当前持仓、平均成本、市值、未实现盈亏和收益率。
6. Stock Detail：展示单只股票的价格走势、买卖点、交易历史、相关新闻和 AI Summary。
7. News & AI Summary：展示持仓股票新闻，并用 AI 生成摘要、利好利空、风险点和关注事项。
8. Settings：管理券商、数据源、API 状态和显示偏好。
9. Login：专业简洁的登录页。

设计风格：
现代金融科技 SaaS 风格，左侧深色导航栏，右侧浅色内容区。使用卡片、表格、图表布局。盈利数字用绿色，亏损数字用红色。整体专业、清爽、适合后台管理系统。

重要限制：
TradePilot 不是荐股软件，AI 只用于信息整理，不提供投资建议。AI Summary 区域需要展示“不构成投资建议”的提示。
```
