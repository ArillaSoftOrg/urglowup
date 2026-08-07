ALTER TABLE "BusinessHour"
ADD COLUMN "appointmentBufferMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "workBlocks" JSONB,
ADD COLUMN "breakBlocks" JSONB,
ADD COLUMN "staffNotes" TEXT,
ADD COLUMN "exceptionNotes" TEXT;
