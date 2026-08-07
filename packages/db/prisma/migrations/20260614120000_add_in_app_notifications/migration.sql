CREATE TYPE "InAppNotificationType" AS ENUM (
    'APPOINTMENT_REQUESTED',
    'APPOINTMENT_CANCELLED_BY_CUSTOMER',
    'REVIEW_RECEIVED',
    'PROFILE_ATTENTION',
    'INTEGRATION_ALERT',
    'TEAM_UPDATE'
);

CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" "InAppNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InAppNotification_businessId_readAt_createdAt_idx" ON "InAppNotification"("businessId", "readAt", "createdAt");
CREATE INDEX "InAppNotification_recipientUserId_readAt_createdAt_idx" ON "InAppNotification"("recipientUserId", "readAt", "createdAt");
CREATE INDEX "InAppNotification_appointmentId_idx" ON "InAppNotification"("appointmentId");

ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
