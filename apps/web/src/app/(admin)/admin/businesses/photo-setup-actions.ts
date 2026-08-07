"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/constants/media";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  fetchGooglePlacePhotoPreviews,
  type GooglePlacePhotoPreview,
} from "@/lib/external/google/places-photos";

const MAX_SETUP_COVERS = 3;
const ALLOWED_CLOUDINARY_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;

export type AdminPhotoSetupResult = {
  success: boolean;
  message?: string;
  mediaId?: string;
};

export type AdminGooglePhotoPreviewResult = {
  success: boolean;
  message?: string;
  photos: GooglePlacePhotoPreview[];
};

const businessIdSchema = z.string().min(1);

const saveCoverSchema = z.object({
  businessId: z.string().min(1),
  publicId: z.string().min(1).max(500),
  url: z.string().url().max(2_000),
  format: z.enum(ALLOWED_CLOUDINARY_FORMATS),
  bytes: z.number().int().positive().max(MAX_IMAGE_SIZE_BYTES),
  originalWidth: z.number().int().positive().max(20_000).optional(),
  originalHeight: z.number().int().positive().max(20_000).optional(),
  rightsConfirmed: z.literal(true),
});

const finalizeSchema = z.object({
  businessId: z.string().min(1),
  rightsConfirmed: z.literal(true),
});

function isExpectedCloudinaryAsset({
  businessId,
  publicId,
  url,
}: {
  businessId: string;
  publicId: string;
  url: string;
}): boolean {
  const expectedPrefix = `urglowup/${businessId}/cover/`;
  if (!publicId.startsWith(expectedPrefix)) return false;

  try {
    const parsed = new URL(url);
    const expectedPathPrefix = `/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/`;
    const decodedPath = decodeURIComponent(parsed.pathname);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      decodedPath.startsWith(expectedPathPrefix) &&
      decodedPath.includes(publicId)
    );
  } catch {
    return false;
  }
}

async function findEligibleDraftBusiness(businessId: string) {
  return db.business.findFirst({
    where: {
      id: businessId,
      status: "DRAFT",
      googlePlaceId: { not: null },
      placeReferences: {
        some: { provider: "GOOGLE", status: "CLAIMED" },
      },
    },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      googlePlaceId: true,
    },
  });
}

export async function adminFetchGooglePhotoPreviews(
  businessId: string,
): Promise<AdminGooglePhotoPreviewResult> {
  await requireRole(UserRole.ADMIN);

  const parsed = businessIdSchema.safeParse(businessId);
  if (!parsed.success) {
    return { success: false, message: "Geçersiz işletme.", photos: [] };
  }

  const business = await findEligibleDraftBusiness(parsed.data);
  if (!business?.googlePlaceId) {
    return {
      success: false,
      message: "Bu işletme Google fotoğraf kurulumuna uygun değil.",
      photos: [],
    };
  }

  const photos = await fetchGooglePlacePhotoPreviews(business.googlePlaceId);
  return {
    success: true,
    photos,
    ...(photos.length === 0
      ? { message: "Google fotoğraf önizlemeleri alınamadı. Kendi dosyalarınızı yine de yükleyebilirsiniz." }
      : {}),
  };
}

export async function adminSaveDraftBusinessCover(
  input: z.infer<typeof saveCoverSchema>,
): Promise<AdminPhotoSetupResult> {
  const admin = await requireRole(UserRole.ADMIN);
  const parsed = saveCoverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  if (!isExpectedCloudinaryAsset(data)) {
    return { success: false, message: "Yüklenen dosya doğrulanamadı. Lütfen yeniden deneyin." };
  }

  const business = await findEligibleDraftBusiness(data.businessId);
  if (!business) {
    try {
      await deleteFromCloudinary(data.publicId, "image");
    } catch {
      // Best-effort cleanup when the draft is no longer eligible.
    }
    return { success: false, message: "Fotoğraf kurulumu artık bu işletme için kullanılamıyor." };
  }

  try {
    const media = await db.$transaction(async (tx) => {
      const covers = await tx.businessMedia.findMany({
        where: { businessId: data.businessId, type: "COVER", status: "ACTIVE" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, sortOrder: true },
      });
      if (covers.length >= MAX_SETUP_COVERS) {
        throw new Error("MAX_SETUP_COVERS");
      }

      const nextSortOrder =
        covers.reduce((max, cover) => Math.max(max, cover.sortOrder), -1) + 1;
      const created = await tx.businessMedia.create({
        data: {
          businessId: data.businessId,
          publicId: data.publicId,
          url: data.url,
          type: "COVER",
          status: "ACTIVE",
          sortOrder: nextSortOrder,
          originalWidth: data.originalWidth ?? null,
          originalHeight: data.originalHeight ?? null,
        },
        select: { id: true },
      });

      if (covers.length === 0) {
        await tx.business.update({
          where: { id: data.businessId },
          data: { coverImageUrl: data.url },
        });
      }

      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: "business.photo_setup.upload_cover",
          targetType: "BusinessMedia",
          targetId: created.id,
          details: `Business ${data.businessId} cover ${covers.length + 1}/${MAX_SETUP_COVERS}`,
        },
      });

      return created;
    });

    revalidatePath(`/admin/businesses/${data.businessId}`);
    return { success: true, mediaId: media.id, message: "Kapak fotoğrafı kaydedildi." };
  } catch (error) {
    try {
      await deleteFromCloudinary(data.publicId, "image");
    } catch {
      // Best-effort cleanup if the database write fails.
    }
    return {
      success: false,
      message:
        error instanceof Error && error.message === "MAX_SETUP_COVERS"
          ? "Kurulum sırasında en fazla 3 kapak fotoğrafı ekleyebilirsiniz."
          : "Fotoğraf kaydedilemedi. Dosya temizlendi; lütfen yeniden deneyin.",
    };
  }
}

export async function adminDeleteDraftBusinessCover(
  businessId: string,
  mediaId: string,
): Promise<AdminPhotoSetupResult> {
  const admin = await requireRole(UserRole.ADMIN);
  const parsed = z
    .object({ businessId: businessIdSchema, mediaId: z.string().min(1) })
    .safeParse({ businessId, mediaId });
  if (!parsed.success) return { success: false, message: "Geçersiz fotoğraf." };

  const business = await findEligibleDraftBusiness(parsed.data.businessId);
  if (!business) return { success: false, message: "Bu taslak artık düzenlenemiyor." };

  const media = await db.businessMedia.findFirst({
    where: {
      id: parsed.data.mediaId,
      businessId: parsed.data.businessId,
      type: "COVER",
      status: "ACTIVE",
    },
    select: { id: true, publicId: true },
  });
  if (!media) return { success: false, message: "Fotoğraf bulunamadı." };

  await db.$transaction(async (tx) => {
    await tx.businessMedia.delete({ where: { id: media.id } });
    const remaining = await tx.businessMedia.findFirst({
      where: { businessId: parsed.data.businessId, type: "COVER", status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { url: true },
    });
    await tx.business.update({
      where: { id: parsed.data.businessId },
      data: { coverImageUrl: remaining?.url ?? null },
    });
    await tx.adminAction.create({
      data: {
        adminId: admin.id,
        action: "business.photo_setup.delete_cover",
        targetType: "BusinessMedia",
        targetId: media.id,
        details: `Business ${parsed.data.businessId}`,
      },
    });
  });

  try {
    await deleteFromCloudinary(media.publicId, "image");
  } catch {
    // The database state is authoritative; Cloudinary cleanup is best effort.
  }

  revalidatePath(`/admin/businesses/${parsed.data.businessId}`);
  return { success: true, message: "Kapak fotoğrafı silindi." };
}

export async function adminFinalizeDraftBusiness(
  input: z.infer<typeof finalizeSchema>,
): Promise<AdminPhotoSetupResult> {
  const admin = await requireRole(UserRole.ADMIN);
  const parsed = finalizeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dosyaları kullanma hakkınız olduğunu onaylayın." };
  }

  const business = await findEligibleDraftBusiness(parsed.data.businessId);
  if (!business) return { success: false, message: "Bu taslak artık yayınlanamıyor." };

  const coverCount = await db.businessMedia.count({
    where: { businessId: business.id, type: "COVER", status: "ACTIVE" },
  });
  if (coverCount < 1) {
    return { success: false, message: "İşletmeyi yayınlamak için en az bir kapak fotoğrafı yükleyin." };
  }
  if (coverCount > MAX_SETUP_COVERS) {
    return { success: false, message: "Kurulumu tamamlamadan önce kapak sayısını 3 veya altına indirin." };
  }

  const nextStatus = business.ownerId ? "ACTIVE_PRIVATE" : "ACTIVE_MARKETPLACE";
  await db.$transaction([
    db.business.update({
      where: { id: business.id },
      data: { status: nextStatus, isMarketplaceVisible: !business.ownerId },
    }),
    db.adminAction.create({
      data: {
        adminId: admin.id,
        action: "business.photo_setup.finalize",
        targetType: "Business",
        targetId: business.id,
        details: `DRAFT → ${nextStatus}; covers:${coverCount}; rightsConfirmed:true`,
      },
    }),
  ]);

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${business.id}`);
  revalidatePath(`/b/${business.slug}`);
  revalidatePath("/", "layout");
  await invalidateCache(`business:v2:slug:${business.slug}`);
  return { success: true, message: "İşletme fotoğraflarıyla birlikte yayınlandı." };
}
