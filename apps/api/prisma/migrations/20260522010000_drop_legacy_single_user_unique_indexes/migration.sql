-- Auth isolation follow-up.
-- The original single-user Prisma unique indexes are plain indexes in
-- PostgreSQL, so DROP CONSTRAINT did not remove them. They must be dropped
-- after their userId-scoped replacements exist.

DROP INDEX IF EXISTS "import_files_fileHash_key";
DROP INDEX IF EXISTS "transaction_events_sourceEventHash_key";
DROP INDEX IF EXISTS "transaction_events_importFileId_rawRowIndex_key";
DROP INDEX IF EXISTS "cash_flows_sourceHash_key";
DROP INDEX IF EXISTS "portfolio_monthly_snapshots_accountId_month_key";
DROP INDEX IF EXISTS "position_monthly_snapshots_accountId_month_symbol_key";
