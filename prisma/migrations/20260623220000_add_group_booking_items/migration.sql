ALTER TABLE "Business"
  ADD COLUMN "maxGroupBookingGuests" INTEGER NOT NULL DEFAULT 4;

ALTER TABLE "Appointment"
  ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "guestCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "totalDurationMinutes" INTEGER,
  ADD COLUMN "totalPrice" DECIMAL(10, 2),
  ADD COLUMN "firstVisit" BOOLEAN;

CREATE TABLE "AppointmentItem" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "guestName" TEXT NOT NULL,
  "guestIndex" INTEGER NOT NULL,
  "serviceId" TEXT NOT NULL,
  "professionalId" TEXT,
  "durationMinutes" INTEGER NOT NULL,
  "priceSnapshot" DECIMAL(10, 2),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AppointmentItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppointmentItem_appointmentId_idx" ON "AppointmentItem"("appointmentId");
CREATE INDEX "AppointmentItem_serviceId_idx" ON "AppointmentItem"("serviceId");
CREATE INDEX "AppointmentItem_professionalId_idx" ON "AppointmentItem"("professionalId");

ALTER TABLE "AppointmentItem"
  ADD CONSTRAINT "AppointmentItem_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AppointmentItem"
  ADD CONSTRAINT "AppointmentItem_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "BusinessService"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AppointmentItem"
  ADD CONSTRAINT "AppointmentItem_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "Professional"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
