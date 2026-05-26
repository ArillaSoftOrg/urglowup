-- CreateEnum
CREATE TYPE "HolidaySuggestionState" AS ENUM ('SUGGESTED', 'APPLIED', 'DISMISSED');

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'TR',
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "PublicHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessHolidaySuggestion" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "holidayId" TEXT NOT NULL,
    "state" "HolidaySuggestionState" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessHolidaySuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicHoliday_country_year_idx" ON "PublicHoliday"("country", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PublicHoliday_country_date_key" ON "PublicHoliday"("country", "date");

-- CreateIndex
CREATE INDEX "BusinessHolidaySuggestion_businessId_state_idx" ON "BusinessHolidaySuggestion"("businessId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHolidaySuggestion_businessId_holidayId_key" ON "BusinessHolidaySuggestion"("businessId", "holidayId");

-- AddForeignKey
ALTER TABLE "BusinessHolidaySuggestion" ADD CONSTRAINT "BusinessHolidaySuggestion_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHolidaySuggestion" ADD CONSTRAINT "BusinessHolidaySuggestion_holidayId_fkey" FOREIGN KEY ("holidayId") REFERENCES "PublicHoliday"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
