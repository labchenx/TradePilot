import type { PortfolioAnalyticsResponse } from '@/types/performance';
import { apiFetch } from './apiClient';

async function requestApi<T>(path: string): Promise<T> {
  const response = await apiFetch(path);

  if (!response.ok) {
    throw new Error(`Performance API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const performanceService = {
  getPerformance() {
    return requestApi<PortfolioAnalyticsResponse>('/portfolio/analytics');
  },
};
