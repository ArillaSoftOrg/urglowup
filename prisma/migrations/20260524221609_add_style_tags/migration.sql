-- CreateTable
CREATE TABLE "StyleTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostStyleTag" (
    "postId" TEXT NOT NULL,
    "styleTagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostStyleTag_pkey" PRIMARY KEY ("postId","styleTagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StyleTag_name_key" ON "StyleTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StyleTag_slug_key" ON "StyleTag"("slug");

-- CreateIndex
CREATE INDEX "StyleTag_categoryId_isActive_idx" ON "StyleTag"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "StyleTag_isActive_sortOrder_idx" ON "StyleTag"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "PostStyleTag_styleTagId_idx" ON "PostStyleTag"("styleTagId");

-- AddForeignKey
ALTER TABLE "StyleTag" ADD CONSTRAINT "StyleTag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostStyleTag" ADD CONSTRAINT "PostStyleTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostStyleTag" ADD CONSTRAINT "PostStyleTag_styleTagId_fkey" FOREIGN KEY ("styleTagId") REFERENCES "StyleTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
