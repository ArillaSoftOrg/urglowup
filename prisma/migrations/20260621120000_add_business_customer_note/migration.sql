CREATE TABLE "BusinessCustomerNote" (
  "id"         TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "note"       TEXT NOT NULL,
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "BusinessCustomerNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BusinessCustomerNote_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  CONSTRAINT "BusinessCustomerNote_businessId_customerId_key"
    UNIQUE ("businessId", "customerId")
);

CREATE INDEX "BusinessCustomerNote_businessId_idx" ON "BusinessCustomerNote"("businessId");
