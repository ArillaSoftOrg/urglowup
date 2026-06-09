-- AlterTable
ALTER TABLE "BusinessService" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BusinessService_slug_key" ON "BusinessService"("slug");
