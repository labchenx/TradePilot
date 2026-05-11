export interface BehaviorMetric {
  label: string;
  value: string;
  tone: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
}

export interface TradingFrequencyPoint {
  month: string;
  buy: number;
  sell: number;
}

export interface BehaviorInsight {
  title: string;
  description: string;
  tone: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
}

