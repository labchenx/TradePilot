import type { BehaviorInsight, BehaviorMetric, TradingFrequencyPoint } from '@/types';

export const mockBehaviorMetrics: BehaviorMetric[] = [
  { label: '月交易次数', value: '8.4', tone: 'blue' },
  { label: '买卖比例', value: '68 / 32', tone: 'green' },
  { label: '平均持仓天数', value: '74d', tone: 'gray' },
  { label: '持仓集中度', value: '28.4%', tone: 'yellow' },
];

export const mockTradingFrequency: TradingFrequencyPoint[] = [
  { month: 'Oct', buy: 4, sell: 1 },
  { month: 'Nov', buy: 7, sell: 2 },
  { month: 'Dec', buy: 5, sell: 4 },
  { month: 'Jan', buy: 8, sell: 3 },
  { month: 'Feb', buy: 6, sell: 3 },
  { month: 'Mar', buy: 9, sell: 5 },
];

export const mockBehaviorInsights: BehaviorInsight[] = [
  {
    title: '持仓集中度可接受',
    description: '最大单一持仓是 AMD，占比 28.4%，低于内部 30% 的提醒阈值。',
    tone: 'green',
  },
  {
    title: '3 月卖出活动增加',
    description: '3 月是样本周期内 SELL 次数最高的月份，可以复盘卖出是计划内止盈止损，还是临时反应。',
    tone: 'yellow',
  },
  {
    title: '暂无高频交易提醒',
    description: '当前交易节奏仍接近组合复盘行为，没有表现为日内投机式交易。',
    tone: 'blue',
  },
];
