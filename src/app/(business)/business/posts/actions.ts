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

const createPostSchema = z.object({
  description: z.string().max(2000).optional().or(z.literal("")),
  relatedServiceId: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  media: z.array(postMediaItemSchema).min(1).max(10),
});

// ─── Create Post ────────────────────────────────────────────────

export async function createPost(
  data: z.infer<typeof createPostSchema>
): Promise<PostActionState> {
  const { businessId } = await requireBusiness();

  const result = createPostSchema.safeParse(data);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { description, relatedServiceId, categoryId, media } = result.data;

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

  await db.post.create({
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
  });

  revalidatePath("/business/posts");
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
