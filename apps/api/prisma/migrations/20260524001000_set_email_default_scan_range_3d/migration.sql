ALTER TABLE "user_settings"
  ALTER COLUMN "emailDefaultScanRange" SET DEFAULT 'SCAN_3D';

UPDATE "user_settings"
SET "emailDefaultScanRange" = 'SCAN_3D'
WHERE "emailDefaultScanRange" = 'SCAN_30D';
