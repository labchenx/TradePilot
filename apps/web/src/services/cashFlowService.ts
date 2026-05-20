import type { CashFlowsData } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4100';

async function requestApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

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
