-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'SYSTEM';
