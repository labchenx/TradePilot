CREATE TYPE "ImportJobStatus" AS ENUM ('PREVIEWED', 'SUCCESS', 'FAILED', 'PARTIAL');

CREATE TYPE "ImportRecordType" AS ENUM ('TRADE', 'CASH_FLOW', 'CORPORATE_ACTION', 'UNRECOGNIZED');

CREATE TYPE "ImportRecordStatus" AS ENUM ('SUCCESS', 'DUPLICATE', 'UPDATED', 'FAILED');

CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL DEFAULT 'IBKR_CSV',
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PREVIEWED',
    "fileNames" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "previewRecords" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "updateCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_records" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "recordType" "ImportRecordType" NOT NULL,
    "sourceHash" TEXT,
    "status" "ImportRecordStatus" NOT NULL,
    "rawData" JSONB,
    "normalizedData" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_jobs_createdAt_idx" ON "import_jobs"("createdAt");
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");
CREATE INDEX "import_records_importJobId_idx" ON "import_records"("importJobId");
CREATE INDEX "import_records_sourceHash_idx" ON "import_records"("sourceHash");
CREATE INDEX "import_records_recordType_idx" ON "import_records"("recordType");

ALTER TABLE "import_records" ADD CONSTRAINT "import_records_importJobId_fkey"
FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
