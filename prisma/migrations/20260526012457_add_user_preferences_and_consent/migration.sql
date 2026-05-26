-- CreateEnum
CREATE TYPE "NotificationLogType" AS ENUM ('TRANSACTIONAL', 'MARKETING');

-- CreateEnum
CREATE TYPE "ConsentCategory" AS ENUM ('PERSONALIZATION', 'ANALYTICS', 'MARKETING');

-- CreateEnum
CREATE TYPE "ConsentAction" AS ENUM ('GRANTED', 'REVOKED');

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "notificationType" "NotificationLogType" NOT NULL DEFAULT 'TRANSACTIONAL',
ADD COLUMN     "recipientUserId" TEXT,
ALTER COLUMN "appointmentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locale" TEXT,
    "personalizationConsentAt" TIMESTAMP(3),
    "personalizationRevokedAt" TIMESTAMP(3),
    "analyticsConsentAt" TIMESTAMP(3),
    "analyticsRevokedAt" TIMESTAMP(3),
    "marketingConsentAt" TIMESTAMP(3),
    "marketingRevokedAt" TIMESTAMP(3),
    "consentVersion" TEXT,
    "emailTransactional" BOOLEAN NOT NULL DEFAULT true,
    "whatsappTransactional" BOOLEAN NOT NULL DEFAULT true,
    "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
    "whatsappMarketing" BOOLEAN NOT NULL DEFAULT false,
    "preferredCategoryIds" JSONB,
    "preferredStyleTagIds" JSONB,
    "affinityComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ConsentCategory" NOT NULL,
    "action" "ConsentAction" NOT NULL,
    "version" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "ConsentAuditLog_userId_category_idx" ON "ConsentAuditLog"("userId", "category");

-- CreateIndex
CREATE INDEX "ConsentAuditLog_createdAt_idx" ON "ConsentAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_recipientUserId_idx" ON "NotificationLog"("recipientUserId");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentAuditLog" ADD CONSTRAINT "ConsentAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
