CREATE TABLE "market_quote_snapshots" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "providerSymbol" TEXT NOT NULL,
    "name" TEXT,
    "price" DECIMAL(30,12) NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "rawData" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_quote_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "market_quote_snapshots_symbol_fetchedAt_idx" ON "market_quote_snapshots"("symbol", "fetchedAt");
CREATE INDEX "market_quote_snapshots_providerSymbol_fetchedAt_idx" ON "market_quote_snapshots"("providerSymbol", "fetchedAt");
