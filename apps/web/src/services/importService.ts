import type {
  ClearDataResponse,
  ImportConfirmResponse,
  ImportDeleteHistoryResponse,
  ImportHistoryItem,
  ImportJobDetail,
  ImportPreviewRecord,
  ImportPreviewResponse,
} from '@/types';
import { apiFetch } from './apiClient';

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = `Import API request failed: ${response.status}`;
  try {
    const body = await response.json();
    message = body.message ?? message;
    if (Array.isArray(message)) {
      message = message.join('; ');
    }
  } catch {
    // Keep the HTTP status message when the backend response is not JSON.
  }

  throw new Error(String(message));
}

export const importService = {
  async previewIbkrCsv(files: File[]): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiFetch('/imports/ibkr-csv/preview', {
      method: 'POST',
      body: formData,
    });

    return parseResponse<ImportPreviewResponse>(response);
  },

  async confirmIbkrCsv(
    jobPreviewId: string,
    _records: ImportPreviewRecord[],
  ): Promise<ImportConfirmResponse> {
    const response = await apiFetch('/imports/ibkr-csv/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobPreviewId }),
    });

    return parseResponse<ImportConfirmResponse>(response);
  },

  async listHistory(): Promise<ImportHistoryItem[]> {
    const response = await apiFetch('/imports/history');
    return parseResponse<ImportHistoryItem[]>(response);
  },

  async getDetail(id: string): Promise<ImportJobDetail> {
    const response = await apiFetch(`/imports/${id}`);
    return parseResponse<ImportJobDetail>(response);
  },

  async deleteHistory(id: string): Promise<ImportDeleteHistoryResponse> {
    const response = await apiFetch(`/imports/history/${id}`, {
      method: 'DELETE',
    });

    return parseResponse<ImportDeleteHistoryResponse>(response);
  },

  async clearData(confirmation: string): Promise<ClearDataResponse> {
    const response = await apiFetch('/portfolio/clear-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation }),
    });

    return parseResponse<ClearDataResponse>(response);
  },
};
