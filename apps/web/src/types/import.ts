import type { TradeSide } from './transaction';

export type ImportPreviewStatus = 'SUCCESS' | 'WARNING' | 'ERROR';

export interface ImportPreviewRecord {
  id: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  fee: number;
  currency: string;
  tradeDate: string;
  status: ImportPreviewStatus;
  message?: string;
}

export interface ImportResult {
  totalRecords: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
}
