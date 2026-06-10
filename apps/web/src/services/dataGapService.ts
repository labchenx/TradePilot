import type {
  DataGapCheckResponse,
  ManualFillResponse,
  ManualFillTradePayload,
} from '@/types';
import { apiFetch } from './apiClient';

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = `数据健康接口请求失败：${response.status}`;
  try {
    const body = await response.json();
    const errorMessage = body.message ?? body.error;
    message = Array.isArray(errorMessage)
      ? errorMessage.join('；')
      : errorMessage ?? message;
  } catch {
    // Keep the HTTP status fallback.
  }

  throw new Error(String(message));
}

export const dataGapService = {
  async checkGaps(lookbackDays = 30) {
    const response = await apiFetch(`/data-gap/check?lookbackDays=${lookbackDays}`);
    return parseResponse<DataGapCheckResponse>(response);
  },

  async manualFill(payload: ManualFillTradePayload) {
    const response = await apiFetch('/data-gap/manual-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseResponse<ManualFillResponse>(response);
  },
};
