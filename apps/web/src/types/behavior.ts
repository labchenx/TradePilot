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

export type TradingBehaviorRange = '1M' | '3M' | 'YTD' | 'ALL';

export interface TradingBehaviorQuery {
  range: TradingBehaviorRange;
  symbol: string;
}

export interface TradingBehaviorSummary {
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  tradedSymbolCount: number;
  totalCommission: number;
  realizedPnl: number;
  avgTradeAmount: number | null;
  winRate: number | null;
}

export interface MonthlyTradeCount {
  month: string;
  buyCount: number;
  sellCount: number;
  totalCount: number;
}

export interface MonthlyTradeAmount {
  month: string;
  buyAmount: number;
  sellAmount: number;
  netBuyAmount: number;
}

export interface SymbolTradingStats {
  symbol: string;
  name?: string;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  buyAmount: number;
  sellAmount: number;
  commission: number;
  realizedPnl: number;
}

export interface RealizedPnlContribution {
  symbol: string;
  realizedPnl: number;
}

export interface TradingBehaviorResponse {
  summary: TradingBehaviorSummary;
  monthlyTradeCounts: MonthlyTradeCount[];
  monthlyTradeAmounts: MonthlyTradeAmount[];
  symbolStats: SymbolTradingStats[];
  realizedPnlContributions: RealizedPnlContribution[];
  warnings: string[];
  updatedAt: string;
}
