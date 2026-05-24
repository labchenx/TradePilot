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

export interface SearchIbkrMailsResponse {
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

export interface ScanAndPreviewIbkrMailsResponse
  extends SearchIbkrMailsResponse {
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
