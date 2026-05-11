import type { ImportPreviewRecord, ImportResult } from '@/types';

export const mockImportPreviewRecords: ImportPreviewRecord[] = [
  {
    id: 'import-preview-1',
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 10,
    price: 172.5,
    fee: 1,
    currency: 'USD',
    tradeDate: '2026-04-28',
    status: 'SUCCESS',
  },
  {
    id: 'import-preview-2',
    symbol: 'TSLA',
    side: 'SELL',
    quantity: 5,
    price: 180.2,
    fee: 1,
    currency: 'USD',
    tradeDate: '2026-04-28',
    status: 'WARNING',
    message: 'Duplicate record',
  },
  {
    id: 'import-preview-3',
    symbol: 'NVDA',
    side: 'BUY',
    quantity: 2,
    price: 850,
    fee: 0,
    currency: 'USD',
    tradeDate: '2026-04-27',
    status: 'ERROR',
    message: 'Missing fee',
  },
];

export const mockImportResult: ImportResult = {
  totalRecords: 3,
  successCount: 1,
  duplicateCount: 1,
  failedCount: 1,
};
