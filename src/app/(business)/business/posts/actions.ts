"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import type { PostStatus } from "@/generated/prisma/enums";

// ─── Types ──────────────────────────────────────────────────────

export type PostActionState = {
  success: boolean;
  message?: string;
};

// ─── Schemas ────────────────────────────────────────────────────

const postMediaItemSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  sortOrder: z.number().int().min(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
});

const createPostSchema = z
  .object({
    description: z.string().max(2000).optional().or(z.literal("")),
    relatedServiceId: z.string().optional().or(z.literal("")),
    categoryId: z.string().optional().or(z.literal("")),
    styleTagIds: z.array(z.string()).max(5).default([]),
    media: z.array(postMediaItemSchema).max(10).default([]),
  })
  .refine(
    (d) => (d.description?.trim().length ?? 0) > 0 || d.media.length > 0,
    { message: "Açıklama veya en az bir görsel/video ekleyin." }
  );

// ─── Create Post ────────────────────────────────────────────────

export async function createPost(
  data: z.infer<typeof createPostSchema>
): Promise<PostActionState> {
  const { businessId } = await requireBusiness();

  const result = createPostSchema.safeParse(data);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { description, relatedServiceId, categoryId, styleTagIds, media } = result.data;

  // Validate relatedServiceId belongs to this business
  if (relatedServiceId) {
    const service = await db.businessService.findFirst({
      where: { id: relatedServiceId, businessId },
      select: { id: true },
    });
    if (!service) {
      return { success: false, message: "Hizmet bu işletmeye ait değil." };
    }
  }

  // Validate categoryId belongs to this business
  if (categoryId) {
    const categoryLink = await db.businessToCategory.findFirst({
      where: { businessId, categoryId },
    });
    if (!categoryLink) {
      return { success: false, message: "Kategori bu işletmeye ait değil." };
    }
  }

  // Validate style tags: each must be active and belong to a category the business is registered under
  let validatedTagIds: string[] = [];
  if (styleTagIds.length > 0) {
    const businessCategoryIds = await db.businessToCategory.findMany({
      where: { businessId },
      select: { categoryId: true },
    });
    const bizCatSet = new Set(businessCategoryIds.map((r) => r.categoryId));

    const tags = await db.styleTag.findMany({
      where: { id: { in: styleTagIds }, isActive: true },
      select: { id: true, categoryId: true },
    });

    if (tags.length !== styleTagIds.length) {
      return { success: false, message: "Bir veya daha fazla stil etiketi geçersiz." };
    }

    // Allow tags whose categoryId is null (universal) or matches a business category
    const invalid = tags.find(
      (t) => t.categoryId !== null && !bizCatSet.has(t.categoryId)
    );
    if (invalid) {
      return { success: false, message: "Seçilen stil etiketi bu işletme kategorisiyle uyuşmuyor." };
    }

    validatedTagIds = tags.map((t) => t.id);
  }

  const post = await db.post.create({
    data: {
      businessId,
      description: description || null,
      relatedServiceId: relatedServiceId || null,
      categoryId: categoryId || null,
      media: {
        createMany: {
          data: media.map((m) => ({
            url: m.url,
            publicId: m.publicId,
            type: m.type,
            sortOrder: m.sortOrder,
            width: m.width ?? null,
            height: m.height ?? null,
            duration: m.duration ?? null,
          })),
        },
      },
    },
    select: { id: true },
  });

  if (validatedTagIds.length > 0) {
    await db.postStyleTag.createMany({
      data: validatedTagIds.map((styleTagId) => ({ postId: post.id, styleTagId })),
    });
    // Revalidate Atlas guide pages for affected tags
    const tagSlugs = await db.styleTag.findMany({
      where: { id: { in: validatedTagIds } },
      select: { slug: true },
    });
    for (const { slug } of tagSlugs) {
      revalidatePath(`/styles/${slug}`);
    }
  }

  revalidatePath("/business/posts");
  revalidatePath("/explore");
  return { success: true, message: "Gönderi paylaşıldı." };
}

// ─── Delete Post ─────────────────────────────────────────────────

export async function deletePost(postId: string): Promise<PostActionState> {
  const { businessId } = await requireBusiness();

  const post = await db.post.findFirst({
    where: { id: postId, businessId },
    include: { media: { select: { publicId: true, type: true } } },
  });
  if (!post) {
    return { success: false, message: "Gönderi bulunamadı." };
  }

  // Delete Cloudinary assets — best effort, continue regardless
  await Promise.allSettled(
    post.media.map((m) =>
      deleteFromCloudinary(m.publicId, m.type === "VIDEO" ? "video" : "image")
    )
  );

  await db.post.delete({ where: { id: postId } });
  revalidatePath("/business/posts");
  return { success: true, message: "Gönderi silindi." };
}

// ─── Update Post Status ──────────────────────────────────────────

export async function updatePostStatus(
  postId: string,
  status: PostStatus
): Promise<PostActionState> {
  const { businessId } = await requireBusiness();

  const post = await db.post.findFirst({
    where: { id: postId, businessId },
    select: { id: true },
  });
  if (!post) {
    return { success: false, message: "Gönderi bulunamadı." };
  }

  await db.post.update({ where: { id: postId }, data: { status } });
  revalidatePath("/business/posts");
  return { success: true };
}
