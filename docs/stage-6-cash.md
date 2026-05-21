# Current Stage: Cash Flows 现金流水页开发（移除交易记录）

## 1. 当前阶段目标

本阶段目标是在之前包含交易记录的现金流水页基础上修改，去除股票交易记录，仅展示入金和出金现金流明细。辅助核验首页现金余额和净入金。

核心目标：

* 展示入金和出金现金流
* 核验首页现金余额和净入金
* 支持导出和筛选

---

## 2. 页面结构

### 2.1 顶部概览卡片

* 总入金 Total Deposits
* 总出金 Total Withdrawals
* 现金余额 Cash Balance
* 净入金 Net Deposit

### 2.2 现金流表格

字段仅保留现金相关：

* 日期 Date
* 类型 Type（Deposit / Withdrawal）
* 金额 Amount
* 币种 Currency
* 备注 Remark / Source

### 2.3 功能与交互

* 支持按类型、日期、金额筛选和排序
* 支持导出 CSV
* 支持 loading / empty / error / warnings 状态

---

## 3. 技术和数据口径

* 数据来源：数据库 cash_flows 表
* 现金余额计算：

```
cashBalance = 初始现金 + 入金总额 + 出金总额
```

* 净入金计算：

```
netDeposit = sum(Deposit) + sum(Withdrawal)
```

* 不展示股票买入/卖出、股息、税费、利息、手续费等其他非入金/出金现金流
* 复杂计算逻辑放到 service / utils 中

---

## 4. 页面交互与 UI

* 顶部概览卡片展示累计指标
* 表格仅显示入金/出金明细
* UI 风格保持与 Overview / Holdings 保持一致
* 不要在 React 页面组件中写复杂计算逻辑

---

## 5. 接口建议

* 如果已有 cash_flows API，优先复用
* 否则新增接口：

```
GET /api/portfolio/cash-flows
```

返回结构示例：

```ts
export interface CashFlowSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  cashBalance: number;
  netDeposit: number;
}

export interface CashFlowItem {
  id: string;
  date: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  currency: string;
  remark?: string;
}

export interface CashFlowsResponse {
  summary: CashFlowSummary;
  items: CashFlowItem[];
  warnings?: string[];
}
```

---

## 6. 验收标准

* 页面展示完整入金/出金明细及概览卡片
* 汇总值与首页一致
* 支持搜索、筛选、排序、导出
* 支持 loading / empty / error / warnings 状态
* UI 风格与 Overview / Holdings 保持一致
