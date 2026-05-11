import type { AiSummary, NewsItem } from '@/types';

export const mockNews: NewsItem[] = [
  {
    id: 'news-1',
    symbol: 'AMD',
    title: "AMD Unveils Next-Gen AI Chips to Challenge Nvidia's Dominance",
    source: 'Reuters',
    publishedAt: '2026-04-28 14:30',
    summary:
      'Advanced Micro Devices announced its new lineup of artificial intelligence chips, aiming to capture more market share from current leader Nvidia.',
  },
  {
    id: 'news-2',
    symbol: 'AAPL',
    title: 'Apple Reports Strong Services Revenue in Q2',
    source: 'Bloomberg',
    publishedAt: '2026-04-27 16:15',
    summary:
      'Apple reported better-than-expected earnings for its fiscal second quarter, driven by robust growth in Services.',
  },
  {
    id: 'news-3',
    symbol: 'TSLA',
    title: 'Tesla Misses Delivery Estimates Amid Supply Chain Challenges',
    source: 'CNBC',
    publishedAt: '2026-04-26 09:00',
    summary:
      'Tesla fell short of delivery expectations, citing ongoing supply chain disruptions and factory downtime.',
  },
  {
    id: 'news-4',
    symbol: 'NVDA',
    title: 'Nvidia Reaches New All-Time High Following Data Center Earnings',
    source: 'Wall Street Journal',
    publishedAt: '2026-04-25 11:45',
    summary:
      'Nvidia shares reached record levels after quarterly results showed strong demand for data center GPUs.',
  },
  {
    id: 'news-5',
    symbol: 'AMD',
    title: 'Analyst Upgrades AMD Price Target citing Data Center Growth',
    source: 'Yahoo Finance',
    publishedAt: '2026-04-23 10:10',
    summary:
      'A major Wall Street firm upgraded AMD, highlighting stronger data center revenue and execution progress.',
  },
];

export const mockAiSummary: AiSummary = {
  overallSummary:
    "AMD is showing strong momentum driven by next-generation AI chip announcements and analyst upgrades. This static summary is a UI placeholder and is not investment advice.",
  positiveFactors: [
    "Launch of competitive next-gen AI chips targeting Nvidia's market share.",
    'Analyst upgrade with a higher price target.',
    'Improving data center revenue narrative.',
  ],
  watchItems: [
    "Market reception and benchmarks versus Nvidia's current offerings.",
    'Execution risk around supply and enterprise adoption.',
  ],
  riskPoints: [
    'Intense competition from established accelerator vendors.',
    'Potential supply chain constraints for advanced chip packaging.',
  ],
};

