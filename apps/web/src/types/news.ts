export interface NewsItem {
  id: string;
  symbol: string;
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
}

export interface AiSummary {
  overallSummary: string;
  positiveFactors: string[];
  watchItems: string[];
  riskPoints: string[];
}

