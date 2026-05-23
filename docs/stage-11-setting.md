# Current Stage：Settings 页面修复（恢复静态版 UI + 接入真实数据）

## 1. 当前阶段目标

本阶段目标是修复当前 Settings / 设置页面。

当前 Codex 生成的 Settings 页面把 Profile、System Status、Data Management、Market Data、Symbol Mapping、Import Settings、Danger Zone 等模块全部纵向铺开，页面变成了偏“后台管理页”的长页面，信息密度过高，和之前静态页面的视觉风格不匹配。

本阶段要求：

```text
恢复之前静态 Settings 页面版本的 UI 和排布方式
在旧静态 UI 基础上接入真实数据
只保留当前阶段必要功能
隐藏或降级展示偏开发调试的高级信息
```

重点不是继续扩展功能，而是收敛 Settings 页面复杂度。

---

## 2. 当前问题

当前页面存在以下问题：

```text
1. 页面纵向过长，所有模块都直接铺开
2. System Status 统计卡片过多，像开发调试面板
3. Market Data 暴露了过多技术配置，例如 Quote Cache TTL、Enable Cache、Missing Symbols
4. Symbol Mapping 空表格默认展示，占用大量空间
5. Import Settings 暴露了 UPDATE_EMPTY_FIELDS、saveRawData 等技术字段
6. 页面整体更像后台管理系统，不像用户设置页
7. 与之前静态 Settings 页面设计不一致
```

---

## 3. 修复原则

### 3.1 UI 以之前静态页面为准

请先搜索项目中是否存在之前的静态 Settings 页面代码、组件或旧版本布局。

如果存在：

```text
优先恢复旧静态 Settings UI
```

如果不存在：

```text
按照之前静态页面风格重建简洁版 Settings UI
```

注意：

```text
current-stage-settings.md 只作为功能参考
不能按它完整展开成一整页后台管理页面
```

### 3.2 只在旧 UI 基础上接真实数据

要求：

```text
保留旧静态页面的布局、卡片、间距、视觉层级
把 mock 数据替换为真实 API 数据
不要因为接入真实数据而改变页面整体结构
不要重写整个 Settings 页面
```

---

## 4. 页面结构调整

Settings 页面建议收敛为以下结构：

```text
Settings / 设置

1. Account 账户信息
2. Data & Sync 数据与同步
3. Import 导入设置
4. Advanced 高级设置，默认折叠
5. Danger Zone 危险操作
```

不要再把所有系统配置都作为主页面大模块纵向铺开。

---

## 5. Account 账户信息

由原来的 Profile 用户信息简化而来。

保留字段：

```text
name
email
createdAt
```

要求：

```text
name 可编辑
email 只读
createdAt 只读
保留保存按钮
布局压缩，不要占用过高高度
```

本阶段不做：

```text
修改邮箱
修改密码
头像上传
邮箱验证
```

---

## 6. Data & Sync 数据与同步

由原来的 Data Management + 部分 Market Data 合并而来。

主页面只保留 3 个常用操作：

```text
1. 重新计算投资数据
2. 刷新当前行情
3. 重建月度趋势
```

### 6.1 重新计算投资数据

面向用户的文案：

```text
重新计算投资数据
根据交易记录、现金流水和公司行动重新计算持仓、成本和资产指标。
```

内部可以调用：

```text
recalculate positions
recalculate metrics
```

不要在 UI 上拆成过多按钮。

### 6.2 刷新当前行情

文案：

```text
刷新当前行情
为当前持仓股票拉取最新价格。
```

内部调用：

```text
refresh quotes
```

### 6.3 重建月度趋势

文案：

```text
重建月度趋势
根据交易记录和历史行情重新生成资产趋势数据。
```

内部调用：

```text
regenerate monthly snapshots
```

### 6.4 后置操作

以下操作不要作为主页面按钮直接展示：

```text
补全历史行情
重新生成 Trading Behavior 缓存
清空快照
清空导入历史
```

如果需要保留，放入 Advanced 高级设置中，默认折叠。

---

## 7. Import 导入设置

Import Settings 需要用户化，不要直接暴露技术字段。

主页面只保留：

```text
默认数据源：IBKR CSV
导入重复记录时：自动跳过 / 自动补全缺失字段
导入完成后自动刷新数据
```

隐藏或放入 Advanced：

```text
saveRawData
UPDATE_EMPTY_FIELDS 原始枚举值
autoRefreshQuotesAfterImport
autoRegenerateSnapshotsAfterImport
autoRecalculateMetricsAfterImport 的技术拆分项
```

重复记录策略展示为用户可理解文案：

```text
自动跳过重复记录
自动补全已有记录缺失字段
```

不要直接展示：

```text
SKIP
UPDATE_EMPTY_FIELDS
```

---

## 8. Market Data 行情设置处理

不要在主页面展示复杂行情配置。

主页面最多展示：

```text
当前行情源：Yahoo Finance
最近行情更新时间
刷新行情按钮
```

以下内容移入 Advanced 或隐藏：

```text
Quote Cache TTL
Enable quote cache
Enable history cache
Quote Cache Count
Price History Count
Missing Quote Symbols
Missing History Symbols
```

如果保留缓存开关，也必须放在 Advanced 中。

---

## 9. System Status 系统状态处理

不要在主页面直接展示大量系统状态卡片。

当前这些内容太像开发调试信息：

```text
TRADES
CASH FLOWS
CORPORATE ACTIONS
POSITIONS
IMPORT JOBS
IMPORT RECORDS
MONTHLY SNAPSHOTS
POSITION SNAPSHOTS
SYMBOL MAPPINGS
QUOTE CACHE
PRICE HISTORY
```

主页面最多保留轻量摘要：

```text
交易记录数
当前持仓数
最近导入时间
最近行情更新时间
```

其它统计信息放到：

```text
Advanced 高级设置 / 开发调试信息
```

并默认折叠。

---

## 10. Symbol Mapping 股票代码映射

Symbol Mapping 不要作为主页面大模块默认展开。

要求：

```text
不要删除 Symbol Mapping service 或接口
不要删除已有功能
UI 上移动到 Advanced 高级设置中
默认折叠
只有用户展开 Advanced 后才展示
```

说明文案：

```text
仅用于行情接口 symbol 转换，不会修改原始交易记录。
```

典型示例：

```text
BRK B -> BRK-B
BRK.B -> BRK-B
```

---

## 11. Advanced 高级设置

Advanced 默认折叠。

可以包含：

```text
Symbol Mapping
行情缓存信息
缺失行情 symbols
缺失历史价格 symbols
系统记录数量
rawData 保存开关
详细导入策略
补全历史行情
```

要求：

```text
高级设置不要影响主页面的简洁性
默认不展开
展开后再显示技术信息
```

---

## 12. Danger Zone 危险操作

保留危险操作区域，但视觉要克制。

必须保留：

```text
清空我的数据
```

要求：

```text
必须二次确认
例如输入 CLEAR
只清空当前用户数据
不清空其他用户数据
不清空公共 price_history
```

说明文案：

```text
此操作会清空当前用户的交易记录、现金流水、导入记录、快照和设置。此操作不可恢复。
```

UI 要求：

```text
可使用浅红色边框或提示
不要占用过大面积
不要设计得过度夸张
```

---

## 13. 数据接入要求

在恢复旧静态 UI 的基础上接入真实数据。

需要接入：

```text
当前用户信息
最近导入时间
最近行情更新时间
基础统计摘要
导入设置
数据同步操作状态
清空数据接口
```

不要求主页面展示全部 API 返回字段。

如果 API 返回了大量字段：

```text
只取 UI 需要展示的字段
其它字段保留在 service 中，不要全部渲染到页面
```

---

## 14. 技术限制

必须遵守：

```text
不要重写整个 Settings 页面
优先恢复旧静态 Settings UI
不要影响 Overview / Holdings / Transactions / Cash Flows / Analytics / Trading Behavior / Imports 页面
不要删除已有 service
不要删除已有接口
不要修改核心业务逻辑
不要在 React 页面组件中写复杂业务逻辑
```

允许：

```text
调整 Settings 页面展示层级
隐藏或折叠高级信息
合并过细的操作按钮
把技术字段转换成用户友好文案
```

---

## 15. UI 要求

页面目标：

```text
简洁
轻量
用户友好
像产品设置页
不像后台管理页
```

视觉要求：

```text
白底卡片
圆角
轻阴影
统一间距
中英文混排但不拥挤
减少大面积表格
减少技术字段暴露
减少统计卡片数量
Advanced 默认折叠
```

---

## 16. 验收标准

完成后需要满足：

1. Settings 页面恢复为之前静态页面版本的布局风格
2. 不再把所有模块纵向铺成后台管理长页面
3. Account 区域展示用户基础信息
4. Data & Sync 区域只保留 3 个主要操作
5. Import 设置文案用户化，不直接展示技术枚举
6. Market Data 不直接展示复杂缓存配置
7. System Status 不直接展示大量统计卡片
8. Symbol Mapping 移入 Advanced，默认折叠
9. Danger Zone 保留清空数据功能并二次确认
10. 页面接入真实数据，不使用 mock
11. 不影响已完成页面
12. 不删除已有接口和 service