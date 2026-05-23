-- Stage 10: Auth user system and per-user data isolation.
-- Existing local data is assigned to a default demo user before userId becomes required.

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

INSERT INTO "users" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt")
VALUES (
  'default_user',
  'demo@tradepilot.local',
  '$2b$12$RvlzYO5QHJSYGLxB5Kr23uni4t99peqCUmGfSatp9zCu1s/eyu3bS',
  'Demo User',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

ALTER TABLE "import_files" ADD COLUMN "userId" TEXT;
ALTER TABLE "import_jobs" ADD COLUMN "userId" TEXT;
ALTER TABLE "import_records" ADD COLUMN "userId" TEXT;
ALTER TABLE "transaction_events" ADD COLUMN "userId" TEXT;
ALTER TABLE "cash_flows" ADD COLUMN "userId" TEXT;
ALTER TABLE "portfolio_monthly_snapshots" ADD COLUMN "userId" TEXT;
ALTER TABLE "position_monthly_snapshots" ADD COLUMN "userId" TEXT;

UPDATE "import_files" SET "userId" = 'default_user' WHERE "userId" IS NULL;
UPDATE "import_jobs" SET "userId" = 'default_user' WHERE "userId" IS NULL;
UPDATE "import_records" SET "userId" = COALESCE(
  (SELECT "userId" FROM "import_jobs" WHERE "import_jobs"."id" = "import_records"."importJobId"),
  'default_user'
) WHERE "userId" IS NULL;
UPDATE "transaction_events" SET "userId" = COALESCE(
  (SELECT "userId" FROM "import_files" WHERE "import_files"."id" = "transaction_events"."importFileId"),
  'default_user'
) WHERE "userId" IS NULL;
UPDATE "cash_flows" SET "userId" = 'default_user' WHERE "userId" IS NULL;
UPDATE "portfolio_monthly_snapshots" SET "userId" = 'default_user' WHERE "userId" IS NULL;
UPDATE "position_monthly_snapshots" SET "userId" = 'default_user' WHERE "userId" IS NULL;

ALTER TABLE "import_files" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "import_jobs" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "import_records" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "transaction_events" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "cash_flows" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "portfolio_monthly_snapshots" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "position_monthly_snapshots" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "import_files" DROP CONSTRAINT IF EXISTS "import_files_fileHash_key";
ALTER TABLE "transaction_events" DROP CONSTRAINT IF EXISTS "transaction_events_sourceEventHash_key";
ALTER TABLE "transaction_events" DROP CONSTRAINT IF EXISTS "transaction_events_importFileId_rawRowIndex_key";
ALTER TABLE "cash_flows" DROP CONSTRAINT IF EXISTS "cash_flows_sourceHash_key";
ALTER TABLE "portfolio_monthly_snapshots" DROP CONSTRAINT IF EXISTS "portfolio_monthly_snapshots_accountId_month_key";
ALTER TABLE "position_monthly_snapshots" DROP CONSTRAINT IF EXISTS "position_monthly_snapshots_accountId_month_symbol_key";

CREATE UNIQUE INDEX "import_files_userId_fileHash_key" ON "import_files"("userId", "fileHash");
CREATE UNIQUE INDEX "transaction_events_userId_sourceEventHash_key" ON "transaction_events"("userId", "sourceEventHash");
CREATE UNIQUE INDEX "transaction_events_userId_importFileId_rawRowIndex_key" ON "transaction_events"("userId", "importFileId", "rawRowIndex");
CREATE UNIQUE INDEX "cash_flows_userId_sourceHash_key" ON "cash_flows"("userId", "sourceHash");
CREATE UNIQUE INDEX "portfolio_monthly_snapshots_userId_accountId_month_key" ON "portfolio_monthly_snapshots"("userId", "accountId", "month");
CREATE UNIQUE INDEX "position_monthly_snapshots_userId_accountId_month_symbol_key" ON "position_monthly_snapshots"("userId", "accountId", "month", "symbol");

CREATE INDEX "import_files_userId_idx" ON "import_files"("userId");
CREATE INDEX "import_jobs_userId_idx" ON "import_jobs"("userId");
CREATE INDEX "import_records_userId_idx" ON "import_records"("userId");
CREATE INDEX "transaction_events_userId_idx" ON "transaction_events"("userId");
CREATE INDEX "cash_flows_userId_idx" ON "cash_flows"("userId");
CREATE INDEX "portfolio_monthly_snapshots_userId_idx" ON "portfolio_monthly_snapshots"("userId");
CREATE INDEX "position_monthly_snapshots_userId_idx" ON "position_monthly_snapshots"("userId");

ALTER TABLE "import_files" ADD CONSTRAINT "import_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction_events" ADD CONSTRAINT "transaction_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portfolio_monthly_snapshots" ADD CONSTRAINT "portfolio_monthly_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "position_monthly_snapshots" ADD CONSTRAINT "position_monthly_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
