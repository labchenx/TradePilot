import type { BehaviorInsight, BehaviorMetric, TradingFrequencyPoint } from '@/types';

export const mockBehaviorMetrics: BehaviorMetric[] = [
  { label: 'Monthly Trades 月交易次数', value: '8.4', tone: 'blue' },
  { label: 'Buy / Sell Ratio 买卖比例', value: '68 / 32', tone: 'green' },
  { label: 'Avg Holding Days 平均持仓', value: '74d', tone: 'gray' },
  { label: 'Concentration 集中度', value: '28.4%', tone: 'yellow' },
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
    title: 'Position concentration is acceptable',
    description: 'The largest single holding is AMD at 28.4%, below the internal 30% warning threshold.',
    tone: 'green',
  },
  {
    title: 'Selling activity increased in March',
    description: 'March had the highest sell count in the sample period. Review whether exits were planned or reactive.',
    tone: 'yellow',
  },
  {
    title: 'No high-frequency warning',
    description: 'Trading cadence is still consistent with portfolio review behavior, not intraday speculation.',
    tone: 'blue',
  },
];

