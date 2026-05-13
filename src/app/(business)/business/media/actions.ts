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
  const { businessId } = await requireBusiness();

  const result = saveMediaSchema.safeParse(data);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { publicId, url, mediaType, resourceType, format, bytes, duration, title, relatedServiceId } =
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

  // Handle cover/logo replacement
  if (mediaType === "COVER" || mediaType === "LOGO") {
    const existing = await db.businessMedia.findFirst({
      where: { businessId, type: mediaType },
    });
    if (existing) {
      try {
        await deleteFromCloudinary(existing.publicId, getResourceType(existing.type));
      } catch { /* best effort */ }
      await db.businessMedia.delete({ where: { id: existing.id } });
    }
  }

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
    },
  });

  // Update business cover/logo URL
  if (mediaType === "COVER") {
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
  const { businessId } = await requireBusiness();

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
  const { businessId } = await requireBusiness();

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

export async function setAsCover(
  mediaId: string
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness();

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
  });
  if (!media || media.businessId !== businessId) {
    return { success: false, message: "Media not found." };
  }

  // Remove existing cover media record
  const existingCover = await db.businessMedia.findFirst({
    where: { businessId, type: "COVER" },
  });
  if (existingCover) {
    try {
      await deleteFromCloudinary(existingCover.publicId, "image");
    } catch { /* best effort */ }
    await db.businessMedia.delete({ where: { id: existingCover.id } });
  }

  // Update this media to COVER type
  await db.businessMedia.update({
    where: { id: mediaId },
    data: { type: "COVER" },
  });

  // Update business coverImageUrl
  await db.business.update({
    where: { id: businessId },
    data: { coverImageUrl: media.url },
  });

  revalidate();
  return { success: true, message: "Cover image updated." };
}

export async function setAsLogo(
  mediaId: string
): Promise<MediaActionState> {
  const { businessId } = await requireBusiness();

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
