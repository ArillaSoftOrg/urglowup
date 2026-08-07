-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING', 'REMOVED');

-- CreateEnum
CREATE TYPE "BusinessOwnershipStatus" AS ENUM ('UNCLAIMED', 'CLAIM_PENDING', 'CLAIMED');

-- CreateEnum
CREATE TYPE "PlaceReferenceStatus" AS ENUM ('DISCOVERED', 'APPROVED', 'HIDDEN', 'DUPLICATE', 'CLAIM_PENDING', 'CLAIMED', 'REJECTED', 'STALE', 'ERROR');

-- CreateEnum
CREATE TYPE "ClaimRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClaimVerificationType" AS ENUM ('PHONE', 'EMAIL', 'DOCUMENT', 'GOOGLE_BUSINESS_PROFILE', 'MANUAL_ADMIN');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "ownershipStatus" "BusinessOwnershipStatus" NOT NULL DEFAULT 'CLAIMED';

-- AlterTable
ALTER TABLE "BusinessMember" ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "PlaceReference" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'GOOGLE',
    "providerPlaceId" TEXT NOT NULL,
    "claimedBusinessId" TEXT,
    "city" TEXT,
    "district" TEXT,
    "categoryHint" TEXT,
    "status" "PlaceReferenceStatus" NOT NULL DEFAULT 'DISCOVERED',
    "lastFetchedAt" TIMESTAMP(3),
    "cacheExpiresAt" TIMESTAMP(3),
    "fetchStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessClaimRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "placeReferenceId" TEXT,
    "status" "ClaimRequestStatus" NOT NULL DEFAULT 'PENDING',
    "verificationType" "ClaimVerificationType",
    "evidenceUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaceReference_city_district_idx" ON "PlaceReference"("city", "district");

-- CreateIndex
CREATE INDEX "PlaceReference_status_idx" ON "PlaceReference"("status");

-- CreateIndex
CREATE INDEX "PlaceReference_claimedBusinessId_idx" ON "PlaceReference"("claimedBusinessId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceReference_provider_providerPlaceId_key" ON "PlaceReference"("provider", "providerPlaceId");

-- CreateIndex
CREATE INDEX "BusinessClaimRequest_userId_idx" ON "BusinessClaimRequest"("userId");

-- CreateIndex
CREATE INDEX "BusinessClaimRequest_businessId_idx" ON "BusinessClaimRequest"("businessId");

-- CreateIndex
CREATE INDEX "BusinessClaimRequest_placeReferenceId_idx" ON "BusinessClaimRequest"("placeReferenceId");

-- CreateIndex
CREATE INDEX "BusinessClaimRequest_status_idx" ON "BusinessClaimRequest"("status");

-- AddForeignKey
ALTER TABLE "PlaceReference" ADD CONSTRAINT "PlaceReference_claimedBusinessId_fkey" FOREIGN KEY ("claimedBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaimRequest" ADD CONSTRAINT "BusinessClaimRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaimRequest" ADD CONSTRAINT "BusinessClaimRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaimRequest" ADD CONSTRAINT "BusinessClaimRequest_placeReferenceId_fkey" FOREIGN KEY ("placeReferenceId") REFERENCES "PlaceReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaimRequest" ADD CONSTRAINT "BusinessClaimRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
