CREATE TYPE "GooglePlaceMatchStatus" AS ENUM (
  'MATCHED',
  'AMBIGUOUS',
  'NOT_FOUND',
  'ERROR'
);

ALTER TABLE "Business"
  ADD COLUMN "googlePlaceMatchStatus" "GooglePlaceMatchStatus",
  ADD COLUMN "googlePlaceMatchAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "googlePlaceMatchError" TEXT;

CREATE INDEX "Business_googlePlaceMatchStatus_googlePlaceMatchAttemptedAt_idx"
  ON "Business"("googlePlaceMatchStatus", "googlePlaceMatchAttemptedAt");
