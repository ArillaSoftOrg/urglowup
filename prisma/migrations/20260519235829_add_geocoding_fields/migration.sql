-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "geocodedAt" TIMESTAMP(3),
ADD COLUMN     "geocodingError" TEXT,
ADD COLUMN     "geocodingStatus" TEXT;
