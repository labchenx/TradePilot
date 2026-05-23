import type {
  ImportSettings,
  MarketDataSettings,
  SettingsProfile,
  SettingsStatus,
  SymbolMapping,
  SymbolMappingPayload,
} from '@/types';
import { apiFetch } from './apiClient';

export async function parseSettingsResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = `Settings API request failed: ${response.status}`;
  try {
    const body = await response.json();
    message = Array.isArray(body.message)
      ? body.message.join('; ')
      : body.message ?? message;
  } catch {
    // Keep the HTTP status when the backend did not return JSON.
  }

  throw new Error(String(message));
}

export const settingsService = {
  async getProfile(): Promise<SettingsProfile> {
    const response = await apiFetch('/api/auth/me');
    const data = await parseSettingsResponse<{ user: SettingsProfile }>(response);
    return data.user;
  },

  async updateProfile(name: string): Promise<SettingsProfile> {
    const response = await apiFetch('/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    return parseSettingsResponse<SettingsProfile>(response);
  },

  async getStatus(): Promise<SettingsStatus> {
    const response = await apiFetch('/api/settings/status');
    return parseSettingsResponse<SettingsStatus>(response);
  },

  async getMarketData(): Promise<MarketDataSettings> {
    const response = await apiFetch('/api/settings/market-data');
    return parseSettingsResponse<MarketDataSettings>(response);
  },

  async updateMarketData(
    payload: Pick<
      MarketDataSettings,
      | 'provider'
      | 'enableQuoteCache'
      | 'quoteCacheTtlMinutes'
      | 'enableHistoryCache'
    >,
  ): Promise<MarketDataSettings> {
    const response = await apiFetch('/api/settings/market-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseSettingsResponse<MarketDataSettings>(response);
  },

  async listSymbolMappings(search?: string): Promise<SymbolMapping[]> {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('search', search.trim());
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await apiFetch(`/api/settings/symbol-mappings${suffix}`);
    return parseSettingsResponse<SymbolMapping[]>(response);
  },

  async createSymbolMapping(
    payload: SymbolMappingPayload,
  ): Promise<SymbolMapping> {
    const response = await apiFetch('/api/settings/symbol-mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseSettingsResponse<SymbolMapping>(response);
  },

  async updateSymbolMapping(
    id: string,
    payload: SymbolMappingPayload,
  ): Promise<SymbolMapping> {
    const response = await apiFetch(`/api/settings/symbol-mappings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseSettingsResponse<SymbolMapping>(response);
  },

  async deleteSymbolMapping(id: string) {
    const response = await apiFetch(`/api/settings/symbol-mappings/${id}`, {
      method: 'DELETE',
    });

    return parseSettingsResponse<{ success: boolean; deletedId: string }>(
      response,
    );
  },

  async getImportSettings(): Promise<ImportSettings> {
    const response = await apiFetch('/api/settings/import');
    return parseSettingsResponse<ImportSettings>(response);
  },

  async updateImportSettings(
    payload: ImportSettings,
  ): Promise<ImportSettings> {
    const response = await apiFetch('/api/settings/import', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseSettingsResponse<ImportSettings>(response);
  },
};
