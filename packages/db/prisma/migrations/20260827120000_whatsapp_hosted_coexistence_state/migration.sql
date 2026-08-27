-- CreateEnum
CREATE TYPE "WhatsAppIntegrationStatus" AS ENUM ('WABA_DISCOVERED', 'PHONE_DISCOVERED', 'CONNECTED', 'FAILED');

-- RenameColumn: Phase 1 guessed "businessPortfolioId"; Phase 1.2 confirmed the
-- account_update/PARTNER_ADDED webhook payload field is owner_business_id.
ALTER TABLE "WhatsAppIntegration" RENAME COLUMN "businessPortfolioId" TO "ownerBusinessId";

-- AlterTable: the hosted PARTNER_ADDED flow persists a row as soon as the
-- WABA ID is known, before phoneNumberId or accessTokenEncrypted exist.
ALTER TABLE "WhatsAppIntegration" ALTER COLUMN "phoneNumberId" DROP NOT NULL;
ALTER TABLE "WhatsAppIntegration" ALTER COLUMN "accessTokenEncrypted" DROP NOT NULL;
ALTER TABLE "WhatsAppIntegration" ADD COLUMN "status" "WhatsAppIntegrationStatus" NOT NULL DEFAULT 'WABA_DISCOVERED';
ALTER TABLE "WhatsAppIntegration" ADD COLUMN "lastError" TEXT;
