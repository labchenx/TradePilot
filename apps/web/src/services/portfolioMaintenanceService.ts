import type { ClearMyDataResponse, MaintenanceResult } from '@/types';
import { apiFetch } from './apiClient';
import { parseSettingsResponse } from './settingsService';

export const portfolioMaintenanceService = {
  async recalculatePositions(): Promise<MaintenanceResult> {
    const response = await apiFetch('/api/portfolio/recalculate-positions', {
      method: 'POST',
    });
    return parseSettingsResponse<MaintenanceResult>(response);
  },

  async regenerateMonthlySnapshots(): Promise<MaintenanceResult> {
    const response = await apiFetch(
      '/api/portfolio/regenerate-monthly-snapshots',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    );
    return parseSettingsResponse<MaintenanceResult>(response);
  },

  async recalculateMetrics(): Promise<MaintenanceResult> {
    const response = await apiFetch('/api/portfolio/recalculate-metrics', {
      method: 'POST',
    });
    return parseSettingsResponse<MaintenanceResult>(response);
  },

  async clearMyData(confirmation: string): Promise<ClearMyDataResponse> {
    const response = await apiFetch('/api/portfolio/clear-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation }),
    });
    return parseSettingsResponse<ClearMyDataResponse>(response);
  },
};
