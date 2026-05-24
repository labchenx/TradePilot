CREATE TYPE "EmailSyncTriggerType" AS ENUM ('MANUAL', 'SCHEDULED');

ALTER TYPE "EmailSyncJobStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "EmailSyncJobStatus" ADD VALUE IF NOT EXISTS 'RUNNING';

ALTER TABLE "user_settings"
ADD COLUMN "emailAutoSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "emailSyncTime" TEXT NOT NULL DEFAULT '07:00',
ADD COLUMN "emailLastSyncStatus" "EmailSyncJobStatus",
ADD COLUMN "emailLastSyncErrorMessage" TEXT;

ALTER TABLE "email_sync_jobs"
ADD COLUMN "triggerType" "EmailSyncTriggerType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "jobKey" TEXT,
ADD COLUMN "parsedTradeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "insertedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "warnings" JSONB;

CREATE INDEX "email_sync_jobs_triggerType_idx" ON "email_sync_jobs"("triggerType");
CREATE INDEX "email_sync_jobs_status_idx" ON "email_sync_jobs"("status");
CREATE UNIQUE INDEX "email_sync_jobs_jobKey_key" ON "email_sync_jobs"("jobKey");
