ALTER TABLE "Business"
ADD COLUMN "marketplaceJoinedAt" TIMESTAMP(3),
ADD COLUMN "isEditoriallyRecommended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "editorialRecommendationRank" INTEGER;

CREATE INDEX "Business_ownershipStatus_marketplaceJoinedAt_idx"
ON "Business"("ownershipStatus", "marketplaceJoinedAt");

CREATE INDEX "Business_isEditoriallyRecommended_editorialRecommendationRank_idx"
ON "Business"("isEditoriallyRecommended", "editorialRecommendationRank");
