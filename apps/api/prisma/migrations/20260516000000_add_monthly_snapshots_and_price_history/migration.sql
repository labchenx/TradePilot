CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "providerSymbol" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "close" DECIMAL(30,12) NOT NULL,
    "adjustedClose" DECIMAL(30,12),
    "currency" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portfolio_monthly_snapshots" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "cashBalance" DECIMAL(30,12) NOT NULL,
    "stockMarketValue" DECIMAL(30,12),
    "totalAssets" DECIMAL(30,12),
    "netDeposit" DECIMAL(30,12) NOT NULL,
    "totalReturn" DECIMAL(30,12),
    "realizedPnl" DECIMAL(30,12) NOT NULL,
    "realizedNetIncome" DECIMAL(30,12) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_monthly_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "position_monthly_snapshots" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" DECIMAL(30,12) NOT NULL,
    "costBasis" DECIMAL(30,12) NOT NULL,
    "marketPrice" DECIMAL(30,12),
    "marketValue" DECIMAL(30,12),
    "unrealizedPnl" DECIMAL(30,12),
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_monthly_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_history_symbol_date_source_key" ON "price_history"("symbol", "date", "source");
CREATE INDEX "price_history_symbol_date_idx" ON "price_history"("symbol", "date");
CREATE INDEX "price_history_providerSymbol_date_idx" ON "price_history"("providerSymbol", "date");

CREATE UNIQUE INDEX "portfolio_monthly_snapshots_accountId_month_key" ON "portfolio_monthly_snapshots"("accountId", "month");
CREATE INDEX "portfolio_monthly_snapshots_accountId_snapshotDate_idx" ON "portfolio_monthly_snapshots"("accountId", "snapshotDate");

CREATE UNIQUE INDEX "position_monthly_snapshots_accountId_month_symbol_key" ON "position_monthly_snapshots"("accountId", "month", "symbol");
CREATE INDEX "position_monthly_snapshots_accountId_month_idx" ON "position_monthly_snapshots"("accountId", "month");
CREATE INDEX "position_monthly_snapshots_symbol_month_idx" ON "position_monthly_snapshots"("symbol", "month");
