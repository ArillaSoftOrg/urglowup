import { db } from "@/lib/db";
import {
  IMAGE_MEDIA_TYPES,
  VIDEO_MEDIA_TYPES,
} from "@/lib/constants/media";

export async function getBusinessMedia(businessId: string) {
  return db.businessMedia.findMany({
    where: { businessId },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    include: {
      relatedService: {
        select: { id: true, name: true },
      },
    },
  });
}

export type BusinessMediaItem = Awaited<
  ReturnType<typeof getBusinessMedia>
>[number];

export async function getMediaCounts(businessId: string) {
  const [imageCount, videoCount] = await Promise.all([
    db.businessMedia.count({
      where: { businessId, type: { in: IMAGE_MEDIA_TYPES } },
    }),
    db.businessMedia.count({
      where: { businessId, type: { in: VIDEO_MEDIA_TYPES } },
    }),
  ]);
  return { imageCount, videoCount };
}
