-- Idempotency support for retried mutating requests (e.g. double-submitted
-- booking creation).
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

CREATE INDEX "IdempotencyKey_createdAt_idx" ON "IdempotencyKey"("createdAt");

-- Double-booking prevention. Partial unique indexes only enforce uniqueness
-- among rows in a blocking status (PENDING, CONFIRMED, CHECKED_IN); Postgres
-- re-evaluates the WHERE predicate on every insert/update, so a cancelled or
-- completed appointment automatically drops out of the constraint.
--
-- Two indexes are needed because Postgres treats each NULL as distinct in a
-- unique index, so a plain unique constraint on professionalId would not
-- catch double-bookings when no professional is assigned.

-- A specific professional can only hold one blocking appointment per
-- business/date/time.
CREATE UNIQUE INDEX "Appointment_professional_slot_unique"
ON "Appointment" ("businessId", "professionalId", "requestedDate", "requestedTime")
WHERE "professionalId" IS NOT NULL
  AND "status" IN ('PENDING', 'CONFIRMED', 'CHECKED_IN');

-- Businesses that don't assign a specific professional have no resource-
-- capacity model yet, so each business/date/time slot is conservatively
-- treated as single-capacity. This is a product decision that may need
-- revisiting if/when a per-business capacity model is introduced.
CREATE UNIQUE INDEX "Appointment_business_slot_unique"
ON "Appointment" ("businessId", "requestedDate", "requestedTime")
WHERE "professionalId" IS NULL
  AND "status" IN ('PENDING', 'CONFIRMED', 'CHECKED_IN');
