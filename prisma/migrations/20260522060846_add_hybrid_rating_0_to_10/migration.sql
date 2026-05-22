-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "trustWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION;

-- DataMigration: convert existing 1-5 ratings to 0-10 scale (oldRating * 2)
UPDATE "Review" SET "rating" = "rating" * 2;

-- CreateTable
CREATE TABLE "BusinessRatingStats" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "rawAverage" DOUBLE PRECISION,
    "rawReviewCount" INTEGER NOT NULL DEFAULT 0,
    "weightedAverage" DOUBLE PRECISION,
    "effectiveReviewCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bayesianScore" DOUBLE PRECISION,
    "recentReviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRatingStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRatingStats_businessId_key" ON "BusinessRatingStats"("businessId");

-- AddForeignKey
ALTER TABLE "BusinessRatingStats" ADD CONSTRAINT "BusinessRatingStats_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
