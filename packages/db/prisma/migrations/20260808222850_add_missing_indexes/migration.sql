-- Missing indexes flagged in the master implementation plan (Phase 5,
-- MUST FIX BEFORE LAUNCH): these tables were queried by businessId/status/
-- customerId constantly with no supporting index.

-- CreateIndex
CREATE INDEX "BusinessService_businessId_isActive_idx" ON "BusinessService"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "Favorite_businessId_idx" ON "Favorite"("businessId");

-- CreateIndex
CREATE INDEX "Review_businessId_status_idx" ON "Review"("businessId", "status");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");
