import type {
  TradingBehaviorQuery,
  TradingBehaviorResponse,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4100';

async function requestApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Trading Behavior API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function buildQueryString(query: TradingBehaviorQuery) {
  const params = new URLSearchParams({ range: query.range });
  const symbol = query.symbol.trim();

  if (symbol) {
    params.set('symbol', symbol.toUpperCase());
  }

  return params.toString();
}

export const behaviorService = {
  getTradingBehavior(query: TradingBehaviorQuery) {
    return requestApi<TradingBehaviorResponse>(
      `/portfolio/trading-behavior?${buildQueryString(query)}`,
    );
  },
};
