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
  source: 'IBKR_CSV' | 'IBKR_EMAIL_PDF';
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

export type EmailImportScanRange = '3d' | '7d' | '30d' | '90d';
export type EmailImportMailStatus = 'NEW' | 'DUPLICATE' | 'ERROR';

export interface EmailImportAttachmentItem {
  filename: string;
  contentType: string;
  size: number;
  attachmentHash: string;
  parsedTradeCount?: number;
  status?: EmailImportMailStatus;
  errorMessage?: string;
}

export interface EmailImportMailItem {
  messageId: string;
  subject: string;
  from: string;
  receivedAt: string | null;
  attachments: EmailImportAttachmentItem[];
  status: EmailImportMailStatus;
  errorMessage?: string;
}

export interface EmailImportMailDiagnostic {
  uid: number;
  subject: string;
  from: string;
  sender: string;
  replyTo: string;
  receivedAt: string | null;
  subjectMatches: boolean;
  fromMatches: boolean;
  pdfCandidateCount: number;
  attachmentNames: string[];
  bodyParts: Array<{
    part?: string;
    type: string;
    disposition?: string;
    filename?: string;
    size?: number;
  }>;
}

export interface EmailImportSearchResponse {
  scannedCount: number;
  matchedCount: number;
  attachmentCount: number;
  parsedTradeCount?: number;
  newCount: number;
  duplicateCount: number;
  errorCount: number;
  mails: EmailImportMailItem[];
  warnings: string[];
  diagnostics?: EmailImportMailDiagnostic[];
}

export interface EmailPdfTradePreview {
  tempId: string;
  messageId: string;
  attachmentHash: string;
  broker: 'IBKR';
  accountId?: string;
  symbol: string;
  tradeDateTime: string;
  tradeDate: string;
  settleDate?: string;
  exchange?: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  proceeds?: number;
  commission?: number;
  fee?: number;
  currency: string;
  orderType?: string;
  code?: string;
  source: 'IBKR_EMAIL_PDF';
  sourceHash: string;
  status: EmailImportMailStatus;
  attachmentFilename?: string;
  errorMessage?: string;
  rawText?: string;
  rawData?: unknown;
}

export interface EmailImportPreviewResponse extends EmailImportSearchResponse {
  parsedTradeCount: number;
  trades: EmailPdfTradePreview[];
}

export interface ConfirmEmailImportResponse {
  importJobId: string;
  insertedCount: number;
  duplicateCount: number;
  errorCount: number;
  warnings: string[];
}

export type EmailSyncTriggerType = 'MANUAL' | 'SCHEDULED';
export type EmailSyncJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'PARTIAL'
  | 'FAILED';

export interface EmailSyncJobHistoryItem {
  id: string;
  triggerType: EmailSyncTriggerType;
  status: EmailSyncJobStatus;
  startedAt: string;
  finishedAt: string | null;
  scannedCount: number;
  matchedCount: number;
  attachmentCount: number;
  parsedTradeCount: number;
  newCount: number;
  insertedCount: number;
  duplicateCount: number;
  errorCount: number;
  errorMessage: string | null;
  warnings: string[];
}

export interface RunEmailSyncResponse {
  jobId: string | null;
  importJobId: string | null;
  triggerType: EmailSyncTriggerType;
  status: EmailSyncJobStatus;
  scannedCount: number;
  matchedCount: number;
  attachmentCount: number;
  parsedTradeCount: number;
  insertedCount: number;
  duplicateCount: number;
  errorCount: number;
  warnings: string[];
}
