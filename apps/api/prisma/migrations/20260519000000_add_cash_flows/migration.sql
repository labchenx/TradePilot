CREATE TYPE "CashFlowType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

CREATE TABLE "cash_flows" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "type" "CashFlowType" NOT NULL,
    "amount" DECIMAL(30,12) NOT NULL,
    "currency" TEXT NOT NULL,
    "flowDate" DATE NOT NULL,
    "source" TEXT,
    "sourceHash" TEXT,
    "rawData" JSONB,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cash_flows_sourceHash_key" ON "cash_flows"("sourceHash");
CREATE INDEX "cash_flows_flowDate_idx" ON "cash_flows"("flowDate");
CREATE INDEX "cash_flows_type_idx" ON "cash_flows"("type");

INSERT INTO "cash_flows" (
    "id",
    "accountId",
    "type",
    "amount",
    "currency",
    "flowDate",
    "source",
    "sourceHash",
    "rawData",
    "remark",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "accountId",
    CASE
        WHEN "eventType" = 'DEPOSIT' THEN 'DEPOSIT'::"CashFlowType"
        ELSE 'WITHDRAWAL'::"CashFlowType"
    END,
    "netAmount",
    COALESCE("currency", 'USD'),
    "tradeDate",
    CONCAT("sourceSection", ' · ', "sourceFileName"),
    COALESCE("sourceEventHash", "id"),
    "rawData",
    NULLIF("description", ''),
    "createdAt",
    "createdAt"
FROM "transaction_events"
WHERE "eventType" IN ('DEPOSIT', 'WITHDRAWAL')
ON CONFLICT ("sourceHash") DO NOTHING;
