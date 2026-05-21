import {
  ImportSummary,
  TransactionEvent,
} from './parsers/transaction-event.types';

export type ImportPreviewRecordType =
  | 'TRADE'
  | 'CASH_FLOW'
  | 'CORPORATE_ACTION'
  | 'UNRECOGNIZED';

export type ImportPreviewRecordStatus =
  | 'NEW'
  | 'DUPLICATE'
  | 'UPDATE'
  | 'ERROR';

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

export interface NormalizedImportRecordData extends TransactionEvent {
  sourceHash?: string;
  sourceFileHash: string;
  sourceFileName: string;
  sourceFileSummary?: ImportSummary;
  amount: number;
  commission: number;
  realizedPnl?: number;
  existingEventId?: string;
}

export interface ImportPreviewRecord {
  tempId: string;
  recordType: ImportPreviewRecordType;
  status: ImportPreviewRecordStatus;
  sourceHash?: string;
  data: NormalizedImportRecordData;
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

export interface ImportConfirmRecord {
  tempId: string;
  recordType: ImportPreviewRecordType;
  status: 'SUCCESS' | 'DUPLICATE' | 'UPDATED' | 'FAILED';
  sourceHash?: string;
  errorMessage?: string;
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
  records: ImportConfirmRecord[];
  warnings: string[];
}
