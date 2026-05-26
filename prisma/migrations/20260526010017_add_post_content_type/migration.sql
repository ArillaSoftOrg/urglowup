-- CreateEnum
CREATE TYPE "PostContentType" AS ENUM ('REAL_WORK', 'INSPIRATION', 'EDUCATIONAL', 'PROMOTION');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "contentType" "PostContentType" NOT NULL DEFAULT 'REAL_WORK';

-- CreateIndex
CREATE INDEX "Post_contentType_status_idx" ON "Post"("contentType", "status");
