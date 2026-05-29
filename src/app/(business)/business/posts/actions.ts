"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import type { PostContentType, PostStatus } from "@/generated/prisma/enums";
import { requireBusiness } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { isSuspended } from "@/lib/admin/user-suspension";

export type PostActionState = {
  success: boolean;
  message?: string;
};

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
    contentType: z.enum(
      ["REAL_WORK", "INSPIRATION", "EDUCATIONAL", "PROMOTION"],
      { error: "Geçerli bir gönderi türü seçin." },
    ),
  })
  .refine(
    (data) => (data.description?.trim().length ?? 0) > 0 || data.media.length > 0,
    { message: "Açıklama veya en az bir görsel/video ekleyin." },
  );

export async function createPost(
  data: z.infer<typeof createPostSchema>,
): Promise<PostActionState> {
  const { businessId, user } = await requireBusiness();

  const owner = await db.user.findUnique({
    where: { id: user.id },
    select: { suspendedAt: true, suspendedUntil: true },
  });

  if (owner && isSuspended(owner as any)) {
    return { success: false, message: "Hesabınız askıya alınmıştır. Destek ile iletişime geçin." };
  }

  const result = createPostSchema.safeParse(data);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const {
    description,
    relatedServiceId,
    categoryId,
    styleTagIds,
    media,
    contentType,
  } = result.data;

  try {
    if (relatedServiceId) {
      const service = await db.businessService.findFirst({
        where: { id: relatedServiceId, businessId },
        select: { id: true },
      });

      if (!service) {
        return { success: false, message: "Hizmet bu işletmeye ait değil." };
      }
    }

    if (categoryId) {
      const categoryLink = await db.businessToCategory.findFirst({
        where: { businessId, categoryId },
      });

      if (!categoryLink) {
        return { success: false, message: "Kategori bu işletmeye ait değil." };
      }
    }

    let validatedTagIds: string[] = [];

    if (styleTagIds.length > 0) {
      const businessCategoryIds = await db.businessToCategory.findMany({
        where: { businessId },
        select: { categoryId: true },
      });
      const businessCategorySet = new Set(
        businessCategoryIds.map((record) => record.categoryId),
      );

      const tags = await db.styleTag.findMany({
        where: { id: { in: styleTagIds }, isActive: true },
        select: { id: true, categoryId: true },
      });

      if (tags.length !== styleTagIds.length) {
        return {
          success: false,
          message: "Bir veya daha fazla stil etiketi geçersiz.",
        };
      }

      const invalidTag = tags.find(
        (tag) =>
          tag.categoryId !== null && !businessCategorySet.has(tag.categoryId),
      );

      if (invalidTag) {
        return {
          success: false,
          message:
            "Seçilen stil etiketi bu işletmenin kategorileriyle uyuşmuyor.",
        };
      }

      validatedTagIds = tags.map((tag) => tag.id);
    }

    const post = await db.post.create({
      data: {
        businessId,
        description: description || null,
        relatedServiceId: relatedServiceId || null,
        categoryId: categoryId || null,
        contentType: contentType as PostContentType,
        media: {
          createMany: {
            data: media.map((item) => ({
              url: item.url,
              publicId: item.publicId,
              type: item.type,
              sortOrder: item.sortOrder,
              width: item.width ?? null,
              height: item.height ?? null,
              duration: item.duration ?? null,
            })),
          },
        },
      },
      select: { id: true },
    });

    if (validatedTagIds.length > 0) {
      await db.postStyleTag.createMany({
        data: validatedTagIds.map((styleTagId) => ({
          postId: post.id,
          styleTagId,
        })),
      });

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
  } catch (error) {
    console.error("[createPost]", error);
    return {
      success: false,
      message: "Gönderi oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }
}

export async function deletePost(postId: string): Promise<PostActionState> {
  const { businessId } = await requireBusiness();

  const post = await db.post.findFirst({
    where: { id: postId, businessId },
    include: { media: { select: { publicId: true, type: true } } },
  });

  if (!post) {
    return { success: false, message: "Gönderi bulunamadı." };
  }

  await Promise.allSettled(
    post.media.map((media) =>
      deleteFromCloudinary(
        media.publicId,
        media.type === "VIDEO" ? "video" : "image",
      ),
    ),
  );

  await db.post.delete({ where: { id: postId } });
  revalidatePath("/business/posts");

  return { success: true, message: "Gönderi silindi." };
}

export async function updatePostStatus(
  postId: string,
  status: PostStatus,
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
