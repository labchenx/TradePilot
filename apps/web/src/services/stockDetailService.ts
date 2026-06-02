import type { StockDetailApiDto, StockDetailTrendRange } from '@/types';
import { apiFetch } from './apiClient';

async function requestApi<T>(path: string): Promise<T> {
  const response = await apiFetch(path);

  if (!response.ok) {
    throw new Error(`Stock detail request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const stockDetailService = {
  getStockDetail(symbol: string, range: StockDetailTrendRange) {
    const params = new URLSearchParams({ range });

    return requestApi<StockDetailApiDto>(
      `/portfolio/stocks/${encodeURIComponent(symbol)}?${params.toString()}`,
    );
  },
};
