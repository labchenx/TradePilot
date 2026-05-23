import type {
  TradingBehaviorQuery,
  TradingBehaviorResponse,
} from '@/types';
import { apiFetch } from './apiClient';

async function requestApi<T>(path: string): Promise<T> {
  const response = await apiFetch(path);

  if (!response.ok) {
    throw new Error(`交易行为 API 请求失败：${response.status}`);
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
