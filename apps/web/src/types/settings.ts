export type MarketDataProvider = 'EASTMONEY';
export type DuplicateStrategy = 'SKIP' | 'UPDATE_EMPTY_FIELDS';
export type ImportSource = 'IBKR_CSV' | 'IBKR_EMAIL_PDF';
export type EmailProvider = 'QQ_MAIL' | 'NETEASE_163';
export type EmailConnectionStatus = 'DISCONNECTED' | 'CONNECTED' | 'ERROR';
export type EmailScanRange = 'SCAN_3D' | 'SCAN_7D' | 'SCAN_30D' | 'SCAN_90D';
export type EmailSettingsSyncStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'PARTIAL'
  | 'FAILED';

export interface SettingsProfile {
  id: string;
  name: string | null;
  email: string;
  createdAt?: string;
}

export interface SettingsStatus {
  tradesCount: number;
  cashFlowsCount: number;
  corporateActionsCount: number;
  positionsCount: number;
  importJobsCount: number;
  importRecordsCount: number;
  monthlySnapshotsCount: number;
  positionSnapshotsCount: number;
  symbolMappingsCount: number;
  quoteCacheCount: number;
  priceHistoryCount: number;
  lastImportAt: string | null;
  lastEmailSyncAt: string | null;
  lastDataSyncAt: string | null;
  lastQuoteUpdatedAt: string | null;
  lastSnapshotGeneratedAt: string | null;
}

export interface MarketDataSettings {
  provider: MarketDataProvider;
  providerLabel?: string;
  enableQuoteCache: boolean;
  quoteCacheTtlMinutes: number;
  enableHistoryCache: boolean;
  quoteCacheCount?: number;
  priceHistoryCount?: number;
  missingQuoteSymbols: string[];
  missingHistorySymbols: string[];
  lastQuoteUpdatedAt?: string | null;
  warnings: string[];
}

export interface SymbolMapping {
  id: string;
  sourceSymbol: string;
  targetSymbol: string;
  provider: MarketDataProvider;
  note: string | null;
  updatedAt: string;
}

export interface SymbolMappingPayload {
  sourceSymbol: string;
  targetSymbol: string;
  provider: MarketDataProvider;
  note?: string;
}

export interface ImportSettings {
  defaultImportSource: ImportSource;
  duplicateStrategy: DuplicateStrategy;
  autoRefreshQuotesAfterImport: boolean;
  autoRegenerateSnapshotsAfterImport: boolean;
  autoRecalculateMetricsAfterImport: boolean;
  saveRawData: boolean;
  updatedAt?: string;
}

export interface EmailSettings {
  provider: EmailProvider;
  providerLabel: string;
  email: string | null;
  hasAuthSecret: boolean;
  status: EmailConnectionStatus;
  lastTestAt: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: EmailSettingsSyncStatus | null;
  lastSyncErrorMessage: string | null;
  errorMessage: string | null;
  defaultScanRange: EmailScanRange;
  autoSyncEnabled: boolean;
  syncTime: string;
  onlyIbkrEmails: boolean;
  onlyPdfAttachments: boolean;
  markAsRead: boolean;
  updatedAt?: string;
}

export interface EmailSettingsPayload {
  provider: EmailProvider;
  email: string;
  authCode?: string;
  defaultScanRange?: EmailScanRange;
  autoSyncEnabled?: boolean;
  syncTime?: string;
  onlyIbkrEmails?: boolean;
  onlyPdfAttachments?: boolean;
  markAsRead?: boolean;
}

export interface MaintenanceResult {
  success: boolean;
  runAt?: string;
  warnings?: string[];
  [key: string]: unknown;
}

export interface ClearMyDataResponse {
  success: boolean;
  deletedCounts: Record<string, number>;
}

export interface ProfileSettings {
  name: string;
  email: string;
}

export interface BrokerSettings {
  broker: string;
  alias: string;
  baseCurrency: string;
}

export interface ServiceStatus {
  label: string;
  description: string;
  connected: boolean;
}
