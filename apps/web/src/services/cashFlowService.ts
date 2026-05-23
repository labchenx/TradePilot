import type { CashFlowsData } from '@/types';
import { apiFetch } from './apiClient';

async function requestApi<T>(path: string): Promise<T> {
  const response = await apiFetch(path);

  if (!response.ok) {
    throw new Error(`Cash Flow API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const cashFlowService = {
  async listCashFlows(): Promise<CashFlowsData> {
    return requestApi<CashFlowsData>('/portfolio/cash-flows');
  },
};
