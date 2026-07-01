CREATE TABLE "BusinessMediaLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessMediaLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessMediaLike_userId_mediaId_key" ON "BusinessMediaLike"("userId", "mediaId");
CREATE INDEX "BusinessMediaLike_mediaId_idx" ON "BusinessMediaLike"("mediaId");
CREATE INDEX "BusinessMediaLike_userId_idx" ON "BusinessMediaLike"("userId");

ALTER TABLE "BusinessMediaLike"
  ADD CONSTRAINT "BusinessMediaLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessMediaLike"
  ADD CONSTRAINT "BusinessMediaLike_mediaId_fkey"
  FOREIGN KEY ("mediaId") REFERENCES "BusinessMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
