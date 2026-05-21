export type ImportPageStatus =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'previewReady'
  | 'confirming'
  | 'success'
  | 'error';

export type ImportRecordType =
  | 'TRADE'
  | 'CASH_FLOW'
  | 'CORPORATE_ACTION'
  | 'UNRECOGNIZED';

export type ImportPreviewStatus = 'NEW' | 'DUPLICATE' | 'UPDATE' | 'ERROR';

export interface ImportPreviewFile {
  fileName: string;
  fileSize: number;
  fileHash: string;
  status: 'PARSED' | 'FAILED';
  totalRows: number;
  parsedRows: number;
  errorRows: number;
  errorMessage?: string;
}

export interface ImportPreviewSummary {
  totalRecords: number;
  newRecords: number;
  duplicateRecords: number;
  updateRecords: number;
  errorRecords: number;
  tradeRecords: number;
  cashFlowRecords: number;
  corporateActionRecords: number;
  unrecognizedRecords: number;
}

export interface ImportPreviewRecord {
  tempId: string;
  recordType: ImportRecordType;
  status: ImportPreviewStatus;
  sourceHash?: string;
  data: {
    tradeDate?: string;
    symbol?: string;
    side?: 'BUY' | 'SELL';
    quantity?: number;
    price?: number;
    amount?: number;
    netAmount?: number;
    grossAmount?: number;
    commission?: number;
    realizedPnl?: number;
    currency?: string;
    eventType?: string;
    ibkrType?: string;
    description?: string;
    accountId?: string;
    sourceFileName?: string;
    sourceSection?: string;
    rawRowIndex?: number;
  };
  rawData?: Record<string, string>;
  errorMessage?: string;
}

export interface ImportPreviewResponse {
  jobPreviewId?: string;
  files: ImportPreviewFile[];
  summary: ImportPreviewSummary;
  records: ImportPreviewRecord[];
  warnings: string[];
}

export interface ImportConfirmResponse {
  importJobId: string;
  summary: {
    totalRecords: number;
    insertedRecords: number;
    duplicateRecords: number;
    updatedRecords: number;
    failedRecords: number;
  };
  records: Array<{
    tempId: string;
    recordType: ImportRecordType;
    status: 'SUCCESS' | 'DUPLICATE' | 'UPDATED' | 'FAILED';
    sourceHash?: string;
    errorMessage?: string;
  }>;
  warnings: string[];
}

export interface ImportHistoryItem {
  id: string;
  source: 'IBKR_CSV';
  status: 'PREVIEWED' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  fileNames: string[];
  summary: ImportPreviewSummary;
  totalCount: number;
  successCount: number;
  duplicateCount: number;
  updateCount: number;
  failedCount: number;
  recordCount: number;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  errorMessage?: string | null;
}

export interface ImportJobDetail extends Omit<ImportHistoryItem, 'recordCount'> {
  records: Array<{
    id: string;
    recordType: ImportRecordType;
    sourceHash?: string;
    status: 'SUCCESS' | 'DUPLICATE' | 'UPDATED' | 'FAILED';
    normalizedData?: ImportPreviewRecord['data'];
    rawData?: Record<string, string>;
    errorMessage?: string;
    createdAt: string;
  }>;
}

export interface ImportDeleteHistoryResponse {
  success: boolean;
  deletedImportJobId: string;
  deletedRecordCount: number;
}

export interface ClearDataResponse {
  success: boolean;
  deletedCounts: Record<string, number>;
}
