"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import {
  IMAGE_MEDIA_TYPES,
  VIDEO_MEDIA_TYPES,
  MAX_IMAGES_PER_BUSINESS,
  MAX_VIDEOS_PER_BUSINESS,
  MAX_COVER_IMAGES,
  MAX_VIDEO_DURATION_SECONDS,
  getResourceType,
} from "@/lib/constants/media";

// ─── Types ──────────────────────────────────────────────────────

export type MediaActionState = {
  success: boolean;
  message?: string;
  mediaId?: string;
};

// ─── Schemas ────────────────────────────────────────────────────

const saveMediaSchema = z.object({
  publicId: z.string().min(1, "Public ID is required"),
  url: z.string().url("Invalid URL"),
  mediaType: z.enum([
    "COVER",
    "LOGO",
    "PORTFOLIO_IMAGE",
    "PORTFOLIO_VIDEO",
    "SERVICE_IMAGE",
    "BEFORE_AFTER",
  ]),
  resourceType: z.enum(["image", "video"]),
  format: z.string().min(1),
  bytes: z.number().int().positive(),
  duration: z.number().optional(),
  title: z.string().max(100).optional().or(z.literal("")),
  relatedServiceId: z.string().optional().or(z.literal("")),
  originalWidth: z.number().int().positive().optional(),
  originalHeight: z.number().int().positive().optional(),
});

const saveCropMetaSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const updateMetaSchema = z.object({
  title: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  relatedServiceId: z.string().optional().or(z.literal("")),
});

// ─── Helpers ────────────────────────────────────────────────────

function revalidate() {
  revalidatePath("/business/media");
  revalidatePath("/business/dashboard");
}

// ─── Save Media Record ──────────────────────────────────────────

export async function saveMediaRecord(
  data: z.infer<typeof saveMediaSchema>
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const result = saveMediaSchema.safeParse(data);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { publicId, url, mediaType, resourceType, duration, title, relatedServiceId, originalWidth, originalHeight } =
    result.data;

  // Validate resource type matches media type
  const expectedResource = getResourceType(mediaType);
  if (resourceType !== expectedResource) {
    return { success: false, message: "Resource type mismatch." };
  }

  // Check video duration
  if (
    resourceType === "video" &&
    duration !== undefined &&
    duration > MAX_VIDEO_DURATION_SECONDS
  ) {
    // Delete the already-uploaded Cloudinary asset
    try {
      await deleteFromCloudinary(publicId, "video");
    } catch { /* best effort */ }
    return {
      success: false,
      message: `Video must be under ${MAX_VIDEO_DURATION_SECONDS} seconds.`,
    };
  }

  // Re-check limits (race condition guard)
  if (mediaType === "COVER") {
    const coverCount = await db.businessMedia.count({
      where: { businessId, type: "COVER" },
    });
    if (coverCount >= MAX_COVER_IMAGES) {
      try { await deleteFromCloudinary(publicId, "image"); } catch { /* best effort */ }
      return { success: false, message: `Kapak fotoğrafı limiti aşıldı (${MAX_COVER_IMAGES}).` };
    }
  }

  if (IMAGE_MEDIA_TYPES.includes(mediaType) && mediaType !== "COVER" && mediaType !== "LOGO") {
    const count = await db.businessMedia.count({
      where: { businessId, type: { in: IMAGE_MEDIA_TYPES } },
    });
    if (count >= MAX_IMAGES_PER_BUSINESS) {
      try { await deleteFromCloudinary(publicId, "image"); } catch { /* best effort */ }
      return { success: false, message: `Image limit reached (${MAX_IMAGES_PER_BUSINESS}).` };
    }
  }

  if (VIDEO_MEDIA_TYPES.includes(mediaType)) {
    const count = await db.businessMedia.count({
      where: { businessId, type: { in: VIDEO_MEDIA_TYPES } },
    });
    if (count >= MAX_VIDEOS_PER_BUSINESS) {
      try { await deleteFromCloudinary(publicId, "video"); } catch { /* best effort */ }
      return { success: false, message: `Video limit reached (${MAX_VIDEOS_PER_BUSINESS}).` };
    }
  }

  // LOGO is singleton — replace existing
  if (mediaType === "LOGO") {
    const existing = await db.businessMedia.findFirst({
      where: { businessId, type: "LOGO" },
    });
    if (existing) {
      try {
        await deleteFromCloudinary(existing.publicId, getResourceType(existing.type));
      } catch { /* best effort */ }
      await db.businessMedia.delete({ where: { id: existing.id } });
    }
  }

  // Track whether this is the very first cover (for coverImageUrl fallback)
  const isFirstCover =
    mediaType === "COVER"
      ? (await db.businessMedia.count({ where: { businessId, type: "COVER" } })) === 0
      : false;

  // Auto sortOrder
  const maxSort = await db.businessMedia.aggregate({
    where: { businessId },
    _max: { sortOrder: true },
  });
  const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  // Create record
  const media = await db.businessMedia.create({
    data: {
      businessId,
      publicId,
      url,
      type: mediaType,
      title: title || null,
      relatedServiceId: relatedServiceId || null,
      sortOrder: nextSort,
      originalWidth: originalWidth ?? null,
      originalHeight: originalHeight ?? null,
    },
  });

  // Update business cover/logo URL
  // COVER: only set coverImageUrl when this is the very first cover record,
  // so it remains a valid fallback for queries that rely on the field.
  // Primary cover changes are handled by setPrimaryCover().
  if (mediaType === "COVER" && isFirstCover) {
    await db.business.update({
      where: { id: businessId },
      data: { coverImageUrl: url },
    });
  } else if (mediaType === "LOGO") {
    await db.business.update({
      where: { id: businessId },
      data: { logoUrl: url },
    });
  }

  revalidate();
  return { success: true, message: "Media uploaded.", mediaId: media.id };
}

// ─── Update Media Metadata ──────────────────────────────────────

export async function updateMediaMeta(
  mediaId: string,
  data: z.infer<typeof updateMetaSchema>
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
  });
  if (!media || media.businessId !== businessId) {
    return { success: false, message: "Media not found." };
  }

  const result = updateMetaSchema.safeParse(data);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: {
      title: result.data.title || null,
      description: result.data.description || null,
      relatedServiceId: result.data.relatedServiceId || null,
    },
  });

  revalidate();
  return { success: true, message: "Media updated." };
}

// ─── Reorder Media ──────────────────────────────────────────────

export async function reorderMedia(
  orderedIds: string[]
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  // Verify all IDs belong to this business
  const media = await db.businessMedia.findMany({
    where: { businessId },
    select: { id: true },
  });
  const ownedIds = new Set(media.map((m) => m.id));

  for (const id of orderedIds) {
    if (!ownedIds.has(id)) {
      return { success: false, message: "Invalid media ID." };
    }
  }

  // Batch update sortOrder
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.businessMedia.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  revalidate();
  return { success: true, message: "Order updated." };
}

// ─── Set as Cover / Logo ────────────────────────────────────────

// Adds a portfolio image to the cover/place photos collection.
// Does NOT delete existing covers — use setPrimaryCover() to change which
// cover appears on the Discover card.
export async function setAsCover(
  mediaId: string
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
  });
  if (!media || media.businessId !== businessId) {
    return { success: false, message: "Media not found." };
  }

  // Check cover limit before converting
  const coverCount = await db.businessMedia.count({
    where: { businessId, type: "COVER" },
  });
  if (coverCount >= MAX_COVER_IMAGES) {
    return { success: false, message: `Kapak fotoğrafı limiti aşıldı (${MAX_COVER_IMAGES}).` };
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { type: "COVER" },
  });

  if (coverCount === 0) {
    await db.business.update({
      where: { id: businessId },
      data: { coverImageUrl: media.url },
    });
  }

  revalidate();
  return { success: true, message: "Kapak koleksiyonuna eklendi." };
}

// Sets the selected COVER item as primary (first by sortOrder).
// Primary cover appears on the Discover/search card.
export async function setPrimaryCover(
  mediaId: string
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
  });
  if (!media || media.businessId !== businessId || media.type !== "COVER") {
    return { success: false, message: "Media not found." };
  }

  const allCovers = await db.businessMedia.findMany({
    where: { businessId, type: "COVER" },
    orderBy: { sortOrder: "asc" },
  });

  if (allCovers.length <= 1) {
    return { success: true, message: "Already primary." };
  }

  // Put selected first, preserve relative order of the rest
  const reordered = [
    media,
    ...allCovers.filter((c) => c.id !== mediaId),
  ];
  const baseSort = allCovers[0].sortOrder;

  await db.$transaction(
    reordered.map((cover, i) =>
      db.businessMedia.update({
        where: { id: cover.id },
        data: { sortOrder: baseSort + i },
      })
    )
  );

  // Keep Business.coverImageUrl in sync with primary
  await db.business.update({
    where: { id: businessId },
    data: { coverImageUrl: media.url },
  });

  revalidate();
  return { success: true, message: "Keşfet kartı güncellendi." };
}

export async function setAsLogo(
  mediaId: string
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
  });
  if (!media || media.businessId !== businessId) {
    return { success: false, message: "Media not found." };
  }

  const existingLogo = await db.businessMedia.findFirst({
    where: { businessId, type: "LOGO" },
  });
  if (existingLogo) {
    try {
      await deleteFromCloudinary(existingLogo.publicId, "image");
    } catch { /* best effort */ }
    await db.businessMedia.delete({ where: { id: existingLogo.id } });
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { type: "LOGO" },
  });

  await db.business.update({
    where: { id: businessId },
    data: { logoUrl: media.url },
  });

  revalidate();
  return { success: true, message: "Logo updated." };
}

// ─── Save Crop Metadata ─────────────────────────────────────────

export async function saveCropMeta(
  mediaId: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
  });
  if (!media || media.businessId !== businessId) {
    return { success: false, message: "Media not found." };
  }

  const result = saveCropMetaSchema.safeParse(crop);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { x, y, width, height } = result.data;

  if (media.originalWidth && media.originalHeight) {
    if (x + width > media.originalWidth || y + height > media.originalHeight) {
      return { success: false, message: "Crop region exceeds image bounds." };
    }
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { cropX: x, cropY: y, cropWidth: width, cropHeight: height },
  });

  revalidate();
  return { success: true, message: "Crop saved." };
}
