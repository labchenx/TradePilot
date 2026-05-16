-- Add event-level idempotency for IBKR imports.
-- Nullable keeps this migration safe for existing local rows; new imports fill it.
ALTER TABLE "transaction_events" ADD COLUMN "sourceEventHash" TEXT;

CREATE UNIQUE INDEX "transaction_events_sourceEventHash_key" ON "transaction_events"("sourceEventHash");
