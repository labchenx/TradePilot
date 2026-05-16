-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('IBKR_CSV');

-- CreateEnum
CREATE TYPE "ImportFileStatus" AS ENUM ('PREVIEWED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "IbkrEventType" AS ENUM ('TRADE_BUY', 'TRADE_SELL', 'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'PAYMENT_IN_LIEU', 'WITHHOLDING_TAX', 'DEBIT_INTEREST', 'OTHER_FEE', 'FX_COMPONENT', 'ADJUSTMENT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "import_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL DEFAULT 'IBKR_CSV',
    "fileHash" TEXT NOT NULL,
    "periodStart" DATE,
    "periodEnd" DATE,
    "status" "ImportFileStatus" NOT NULL DEFAULT 'PREVIEWED',
    "summary" JSONB NOT NULL,
    "previewEvents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "import_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_events" (
    "id" TEXT NOT NULL,
    "importFileId" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "sourceSection" TEXT NOT NULL,
    "rawRowIndex" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "tradeDate" DATE NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ibkrType" TEXT NOT NULL,
    "eventType" "IbkrEventType" NOT NULL,
    "symbol" TEXT,
    "quantity" DECIMAL(30,12),
    "absQuantity" DECIMAL(30,12),
    "price" DECIMAL(30,12),
    "currency" TEXT,
    "grossAmount" DECIMAL(30,12) NOT NULL,
    "commission" DECIMAL(30,12) NOT NULL,
    "netAmount" DECIMAL(30,12) NOT NULL,
    "side" "TradeSide",
    "isTrade" BOOLEAN NOT NULL,
    "isExternalCashFlow" BOOLEAN NOT NULL,
    "isIncome" BOOLEAN NOT NULL,
    "isTaxOrFee" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "import_files_fileHash_key" ON "import_files"("fileHash");

-- CreateIndex
CREATE INDEX "transaction_events_tradeDate_idx" ON "transaction_events"("tradeDate");

-- CreateIndex
CREATE INDEX "transaction_events_eventType_idx" ON "transaction_events"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_events_importFileId_rawRowIndex_key" ON "transaction_events"("importFileId", "rawRowIndex");

-- AddForeignKey
ALTER TABLE "transaction_events" ADD CONSTRAINT "transaction_events_importFileId_fkey" FOREIGN KEY ("importFileId") REFERENCES "import_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
