-- CouponType enum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- BusinessService: sale price fields
ALTER TABLE "BusinessService"
  ADD COLUMN "salePrice"  DECIMAL(10,2),
  ADD COLUMN "saleEndsAt" TIMESTAMPTZ;

-- Appointment: coupon tracking
ALTER TABLE "Appointment"
  ADD COLUMN "couponId"       TEXT,
  ADD COLUMN "discountAmount" DECIMAL(10,2);

-- Coupon table
CREATE TABLE "Coupon" (
  "id"            TEXT        NOT NULL,
  "businessId"    TEXT        NOT NULL,
  "code"          TEXT        NOT NULL,
  "type"          "CouponType" NOT NULL,
  "value"         FLOAT       NOT NULL,
  "minOrderValue" FLOAT,
  "usageLimit"    INT,
  "usedCount"     INT         NOT NULL DEFAULT 0,
  "expiresAt"     TIMESTAMPTZ,
  "isActive"      BOOLEAN     NOT NULL DEFAULT true,
  "isLoyalty"     BOOLEAN     NOT NULL DEFAULT false,
  "forCustomerId" TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Coupon_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  CONSTRAINT "Coupon_businessId_code_key"
    UNIQUE ("businessId", "code")
);

CREATE INDEX "Coupon_businessId_idx"   ON "Coupon"("businessId");
CREATE INDEX "Coupon_forCustomerId_idx" ON "Coupon"("forCustomerId");

-- Appointment → Coupon FK
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL;

-- WaitlistEntry table
CREATE TABLE "WaitlistEntry" (
  "id"          TEXT        NOT NULL,
  "businessId"  TEXT        NOT NULL,
  "customerId"  TEXT        NOT NULL,
  "serviceId"   TEXT        NOT NULL,
  "date"        DATE        NOT NULL,
  "time"        TEXT        NOT NULL,
  "notifiedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WaitlistEntry_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  CONSTRAINT "WaitlistEntry_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "WaitlistEntry_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "BusinessService"("id") ON DELETE CASCADE,
  CONSTRAINT "WaitlistEntry_unique"
    UNIQUE ("businessId", "customerId", "serviceId", "date", "time")
);

CREATE INDEX "WaitlistEntry_businessId_date_time_idx" ON "WaitlistEntry"("businessId", "date", "time");
CREATE INDEX "WaitlistEntry_customerId_idx" ON "WaitlistEntry"("customerId");
