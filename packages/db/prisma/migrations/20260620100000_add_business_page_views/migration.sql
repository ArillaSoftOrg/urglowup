CREATE TABLE "BusinessPageView" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "source" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "BusinessPageView_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BusinessPageView_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE INDEX "BusinessPageView_businessId_createdAt_idx"
  ON "BusinessPageView"("businessId", "createdAt" DESC);
