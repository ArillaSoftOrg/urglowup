-- CreateEnum
CREATE TYPE "ExternalProvider" AS ENUM ('GOOGLE_BUSINESS_PROFILE');

-- CreateEnum
CREATE TYPE "ExternalConnectionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "ExternalSyncStatus" AS ENUM ('IDLE', 'SYNCING', 'ERROR');

-- CreateEnum
CREATE TYPE "ExternalReviewVisibility" AS ENUM ('VISIBLE', 'HIDDEN_BY_SYSTEM');

-- CreateEnum
CREATE TYPE "ExternalMediaVisibility" AS ENUM ('VISIBLE', 'HIDDEN_BY_BUSINESS', 'HIDDEN_BY_SYSTEM');

-- CreateTable
CREATE TABLE "BusinessExternalConnection" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerAccountName" TEXT,
    "providerLocationId" TEXT,
    "providerLocationName" TEXT,
    "placeId" TEXT,
    "connectedByUserId" TEXT NOT NULL,
    "scopes" TEXT[],
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "ExternalConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "disconnectedAt" TIMESTAMP(3),
    "syncStatus" "ExternalSyncStatus" NOT NULL DEFAULT 'IDLE',
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "showExternalReviews" BOOLEAN NOT NULL DEFAULT true,
    "showExternalPhotos" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessExternalConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalReviewCache" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "providerReviewId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewerDisplayName" TEXT NOT NULL,
    "reviewerProfilePhotoUrl" TEXT,
    "createTime" TIMESTAMP(3),
    "updateTime" TIMESTAMP(3),
    "merchantReply" TEXT,
    "mediaItemsJson" TEXT,
    "attribution" TEXT,
    "sourceUrl" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "visibilityStatus" "ExternalReviewVisibility" NOT NULL DEFAULT 'VISIBLE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalReviewCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalMediaCache" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "providerMediaId" TEXT NOT NULL,
    "mediaFormat" TEXT NOT NULL,
    "category" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "attribution" TEXT,
    "createTime" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "visibilityStatus" "ExternalMediaVisibility" NOT NULL DEFAULT 'VISIBLE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeaturedByBusiness" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalMediaCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessExternalConnection_businessId_idx" ON "BusinessExternalConnection"("businessId");

-- CreateIndex
CREATE INDEX "BusinessExternalConnection_status_idx" ON "BusinessExternalConnection"("status");

-- CreateIndex
CREATE INDEX "BusinessExternalConnection_provider_syncStatus_idx" ON "BusinessExternalConnection"("provider", "syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessExternalConnection_businessId_provider_key" ON "BusinessExternalConnection"("businessId", "provider");

-- CreateIndex
CREATE INDEX "ExternalReviewCache_businessId_provider_idx" ON "ExternalReviewCache"("businessId", "provider");

-- CreateIndex
CREATE INDEX "ExternalReviewCache_expiresAt_idx" ON "ExternalReviewCache"("expiresAt");

-- CreateIndex
CREATE INDEX "ExternalReviewCache_businessId_visibilityStatus_idx" ON "ExternalReviewCache"("businessId", "visibilityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalReviewCache_businessId_provider_providerReviewId_key" ON "ExternalReviewCache"("businessId", "provider", "providerReviewId");

-- CreateIndex
CREATE INDEX "ExternalMediaCache_businessId_provider_idx" ON "ExternalMediaCache"("businessId", "provider");

-- CreateIndex
CREATE INDEX "ExternalMediaCache_expiresAt_idx" ON "ExternalMediaCache"("expiresAt");

-- CreateIndex
CREATE INDEX "ExternalMediaCache_businessId_visibilityStatus_idx" ON "ExternalMediaCache"("businessId", "visibilityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMediaCache_businessId_provider_providerMediaId_key" ON "ExternalMediaCache"("businessId", "provider", "providerMediaId");

-- AddForeignKey
ALTER TABLE "BusinessExternalConnection" ADD CONSTRAINT "BusinessExternalConnection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessExternalConnection" ADD CONSTRAINT "BusinessExternalConnection_connectedByUserId_fkey" FOREIGN KEY ("connectedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalReviewCache" ADD CONSTRAINT "ExternalReviewCache_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalReviewCache" ADD CONSTRAINT "ExternalReviewCache_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BusinessExternalConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMediaCache" ADD CONSTRAINT "ExternalMediaCache_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMediaCache" ADD CONSTRAINT "ExternalMediaCache_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BusinessExternalConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
