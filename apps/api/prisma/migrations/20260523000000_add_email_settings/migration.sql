CREATE TYPE "EmailProvider" AS ENUM ('QQ_MAIL', 'NETEASE_163');
CREATE TYPE "EmailConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');
CREATE TYPE "EmailScanRange" AS ENUM ('SCAN_7D', 'SCAN_30D', 'SCAN_90D');

ALTER TABLE "user_settings"
  ADD COLUMN "emailProvider" "EmailProvider" NOT NULL DEFAULT 'QQ_MAIL',
  ADD COLUMN "emailAddress" TEXT,
  ADD COLUMN "emailImapHost" TEXT,
  ADD COLUMN "emailImapPort" INTEGER,
  ADD COLUMN "emailImapSecure" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "emailAuthSecretEncrypted" TEXT,
  ADD COLUMN "emailConnectionStatus" "EmailConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
  ADD COLUMN "emailLastTestAt" TIMESTAMP(3),
  ADD COLUMN "emailLastSyncAt" TIMESTAMP(3),
  ADD COLUMN "emailErrorMessage" TEXT,
  ADD COLUMN "emailDefaultScanRange" "EmailScanRange" NOT NULL DEFAULT 'SCAN_7D',
  ADD COLUMN "emailOnlyIbkrEmails" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "emailOnlyPdfAttachments" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "emailMarkAsRead" BOOLEAN NOT NULL DEFAULT false;
