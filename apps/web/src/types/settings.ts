export type MarketDataProvider = 'YAHOO_FINANCE';
export type DuplicateStrategy = 'SKIP' | 'UPDATE_EMPTY_FIELDS';
export type ImportSource = 'IBKR_CSV';

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
