-- Settings is user-scoped configuration. Public market data tables stay shared.
CREATE TYPE "MarketDataProvider" AS ENUM ('YAHOO_FINANCE');
CREATE TYPE "DuplicateStrategy" AS ENUM ('SKIP', 'UPDATE_EMPTY_FIELDS');

CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketDataProvider" "MarketDataProvider" NOT NULL DEFAULT 'YAHOO_FINANCE',
    "enableQuoteCache" BOOLEAN NOT NULL DEFAULT true,
    "quoteCacheTtlMinutes" INTEGER NOT NULL DEFAULT 60,
    "enableHistoryCache" BOOLEAN NOT NULL DEFAULT true,
    "defaultImportSource" "ImportSource" NOT NULL DEFAULT 'IBKR_CSV',
    "duplicateStrategy" "DuplicateStrategy" NOT NULL DEFAULT 'UPDATE_EMPTY_FIELDS',
    "autoRefreshQuotesAfterImport" BOOLEAN NOT NULL DEFAULT true,
    "autoRegenerateSnapshotsAfterImport" BOOLEAN NOT NULL DEFAULT true,
    "autoRecalculateMetricsAfterImport" BOOLEAN NOT NULL DEFAULT true,
    "saveRawData" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "symbol_mappings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceSymbol" TEXT NOT NULL,
    "targetSymbol" TEXT NOT NULL,
    "provider" "MarketDataProvider" NOT NULL DEFAULT 'YAHOO_FINANCE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symbol_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");
CREATE INDEX "user_settings_userId_idx" ON "user_settings"("userId");
CREATE INDEX "symbol_mappings_userId_idx" ON "symbol_mappings"("userId");
CREATE INDEX "symbol_mappings_sourceSymbol_idx" ON "symbol_mappings"("sourceSymbol");
CREATE INDEX "symbol_mappings_targetSymbol_idx" ON "symbol_mappings"("targetSymbol");
CREATE UNIQUE INDEX "symbol_mappings_userId_provider_sourceSymbol_key" ON "symbol_mappings"("userId", "provider", "sourceSymbol");

ALTER TABLE "user_settings"
  ADD CONSTRAINT "user_settings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "symbol_mappings"
  ADD CONSTRAINT "symbol_mappings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
