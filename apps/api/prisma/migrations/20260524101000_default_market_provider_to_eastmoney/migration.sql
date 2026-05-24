ALTER TABLE "user_settings"
  ALTER COLUMN "marketDataProvider" SET DEFAULT 'EASTMONEY';

ALTER TABLE "symbol_mappings"
  ALTER COLUMN "provider" SET DEFAULT 'EASTMONEY';

UPDATE "user_settings"
SET "marketDataProvider" = 'EASTMONEY'
WHERE "marketDataProvider" = 'YAHOO_FINANCE';

UPDATE "symbol_mappings"
SET "provider" = 'EASTMONEY'
WHERE "provider" = 'YAHOO_FINANCE';
