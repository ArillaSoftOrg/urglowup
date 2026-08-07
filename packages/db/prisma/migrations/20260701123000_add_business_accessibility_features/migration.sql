-- AlterTable
ALTER TABLE "Business" ADD COLUMN "wheelchairAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "parkingAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "nearPublicTransit" BOOLEAN NOT NULL DEFAULT false;
