CREATE TYPE "EmailMessageStatus" AS ENUM ('FOUND', 'DUPLICATE', 'ERROR');
CREATE TYPE "EmailSyncJobStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

CREATE TABLE "email_message_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailAccountId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "attachmentNames" JSONB NOT NULL,
    "attachmentHashes" JSONB NOT NULL,
    "status" "EmailMessageStatus" NOT NULL DEFAULT 'FOUND',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_message_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_sync_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailAccountId" TEXT NOT NULL,
    "status" "EmailSyncJobStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "scannedCount" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "attachmentCount" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_message_records_userId_messageId_key" ON "email_message_records"("userId", "messageId");
CREATE INDEX "email_message_records_userId_idx" ON "email_message_records"("userId");
CREATE INDEX "email_message_records_emailAccountId_idx" ON "email_message_records"("emailAccountId");
CREATE INDEX "email_message_records_receivedAt_idx" ON "email_message_records"("receivedAt");
CREATE INDEX "email_sync_jobs_userId_idx" ON "email_sync_jobs"("userId");
CREATE INDEX "email_sync_jobs_emailAccountId_idx" ON "email_sync_jobs"("emailAccountId");
CREATE INDEX "email_sync_jobs_createdAt_idx" ON "email_sync_jobs"("createdAt");

ALTER TABLE "email_message_records"
  ADD CONSTRAINT "email_message_records_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_sync_jobs"
  ADD CONSTRAINT "email_sync_jobs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
