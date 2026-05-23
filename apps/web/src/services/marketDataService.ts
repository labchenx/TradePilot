import type { MaintenanceResult } from '@/types';
import { apiFetch } from './apiClient';
import { parseSettingsResponse } from './settingsService';

export const marketDataService = {
  async refreshQuotes(): Promise<MaintenanceResult> {
    const response = await apiFetch('/api/market/refresh-quotes', {
      method: 'POST',
    });
    return parseSettingsResponse<MaintenanceResult>(response);
  },

  async backfillHistory(): Promise<MaintenanceResult> {
    const response = await apiFetch('/api/market/backfill-history', {
      method: 'POST',
    });
    return parseSettingsResponse<MaintenanceResult>(response);
  },
};
