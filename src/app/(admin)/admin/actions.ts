"use server";

import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import {
  ADMIN_STATUS_TRANSITIONS,
  MARKETPLACE_VISIBILITY_FOR_STATUS,
} from "@/lib/constants/business";
import type { BusinessStatus, PostStatus } from "@/generated/prisma/enums";

export type AdminActionState = {
  success: boolean;
  message?: string;
};

// ─── Logging ───────────────────────────────────────────────────

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: string
): Promise<void> {
  try {
    await db.adminAction.create({
      data: { adminId, action, targetType, targetId, details },
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

async function getBusinessSlug(
  businessId: string
): Promise<string | null> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: { slug: true },
  });
  return biz?.slug ?? null;
}

async function revalidateMarketplacePathsForBusiness(
  businessId: string
): Promise<void> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      slug: true,
      city: true,
      district: true,
      categories: {
        select: { category: { select: { slug: true } } },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/explore");

  if (!business) return;

  if (business.slug) {
    revalidatePath(`/b/${business.slug}`);
  }

  for (const bc of business.categories) {
    revalidatePath(`/category/${bc.category.slug}`);
  }

  if (business.city) {
    const encodedCity = encodeURIComponent(business.city);
    revalidatePath(`/city/${encodedCity}`);

    if (business.district) {
      const encodedDistrict = encodeURIComponent(business.district);
      revalidatePath(`/city/${encodedCity}/${encodedDistrict}`);
    }
  }
}

// ─── Business Actions ──────────────────────────────────────────

const updateStatusSchema = z.object({
  businessId: z.string().min(1),
  newStatus: z.enum([
    "ACTIVE_PRIVATE",
    "ACTIVE_MARKETPLACE",
    "SUSPENDED",
    "REJECTED",
  ]),
});

export async function updateBusinessStatus(
  businessId: string,
  newStatus: BusinessStatus
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = updateStatusSchema.safeParse({ businessId, newStatus });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { status: true, slug: true },
  });

  if (!business) {
    return { success: false, message: "Business not found." };
  }

  const allowed = ADMIN_STATUS_TRANSITIONS[business.status];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Cannot change status from ${business.status} to ${newStatus}.`,
    };
  }

  const isMarketplaceVisible = MARKETPLACE_VISIBILITY_FOR_STATUS[newStatus];

  await db.business.update({
    where: { id: businessId },
    data: { status: newStatus, isMarketplaceVisible },
  });

  const actionName =
    newStatus === "REJECTED"
      ? "business.reject"
      : newStatus === "SUSPENDED"
        ? "business.suspend"
        : newStatus === "ACTIVE_PRIVATE"
          ? "business.activate_private"
          : "business.activate_marketplace";

  await logAdminAction(
    admin.id,
    actionName,
    "Business",
    businessId,
    `${business.status} → ${newStatus}`
  );

  revalidateAdmin();
  if (newStatus === "ACTIVE_MARKETPLACE" || business.status === "ACTIVE_MARKETPLACE") {
    await revalidateMarketplacePathsForBusiness(businessId);
  }

  return { success: true, message: `Status updated to ${newStatus}.` };
}

export async function toggleMarketplaceVisibility(
  businessId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { status: true, isMarketplaceVisible: true, slug: true },
  });

  if (!business) {
    return { success: false, message: "Business not found." };
  }

  if (business.status !== "ACTIVE_MARKETPLACE") {
    return {
      success: false,
      message:
        "Marketplace visibility can only be toggled for Active (Marketplace) businesses.",
    };
  }

  const newValue = !business.isMarketplaceVisible;

  await db.business.update({
    where: { id: businessId },
    data: { isMarketplaceVisible: newValue },
  });

  await logAdminAction(
    admin.id,
    "business.toggle_marketplace",
    "Business",
    businessId,
    `isMarketplaceVisible: ${business.isMarketplaceVisible} → ${newValue}`
  );

  revalidateAdmin();
  await revalidateMarketplacePathsForBusiness(businessId);
  return {
    success: true,
    message: `Marketplace visibility ${newValue ? "enabled" : "disabled"}.`,
  };
}

// ─── User Actions ──────────────────────────────────────────────

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: z.enum(["CUSTOMER", "BUSINESS_OWNER", "ADMIN"]),
});

export async function changeUserRole(
  userId: string,
  newRole: UserRole
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = changeRoleSchema.safeParse({ userId, newRole });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  if (userId === admin.id) {
    return { success: false, message: "Cannot change your own role." };
  }

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!targetUser) {
    return { success: false, message: "User not found." };
  }

  if (targetUser.role === newRole) {
    return { success: false, message: "User already has this role." };
  }

  // Guard: cannot demote BUSINESS_OWNER → CUSTOMER (would orphan business)
  if (targetUser.role === "BUSINESS_OWNER" && newRole === "CUSTOMER") {
    return {
      success: false,
      message:
        "Cannot change role while user owns an active business. Not supported in this version.",
    };
  }

  // Guard: cannot remove last admin
  if (targetUser.role === "ADMIN" && newRole !== "ADMIN") {
    const adminCount = await db.user.count({
      where: { role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return {
        success: false,
        message: "Cannot remove the last admin.",
      };
    }
  }

  // Guard: BUSINESS_OWNER requires existing Business record
  if (newRole === "BUSINESS_OWNER") {
    const business = await db.business.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!business) {
      return {
        success: false,
        message:
          "User must complete business registration first. Cannot assign Business Owner role without a business.",
      };
    }
  }

  const oldRole = targetUser.role;

  await db.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await logAdminAction(
    admin.id,
    "user.change_role",
    "User",
    userId,
    `${oldRole} → ${newRole}`
  );

  revalidateAdmin();
  return { success: true, message: `Role updated to ${newRole}.` };
}

// ─── Media Actions (Soft Moderation) ───────────────────────────

async function clearCoverLogoIfNeeded(
  mediaId: string,
  businessId: string,
  mediaType: string
) {
  if (mediaType === "COVER") {
    await db.business.update({
      where: { id: businessId },
      data: { coverImageUrl: null },
    });
  } else if (mediaType === "LOGO") {
    await db.business.update({
      where: { id: businessId },
      data: { logoUrl: null },
    });
  }
}

export async function hideMedia(
  mediaId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
    select: { status: true, type: true, businessId: true },
  });

  if (!media) {
    return { success: false, message: "Media not found." };
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { status: "HIDDEN" },
  });

  await clearCoverLogoIfNeeded(mediaId, media.businessId, media.type);

  await logAdminAction(
    admin.id,
    "media.hide",
    "BusinessMedia",
    mediaId,
    `${media.status} → HIDDEN`
  );

  const slug = await getBusinessSlug(media.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Media hidden." };
}

export async function removeMedia(
  mediaId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
    select: { status: true, type: true, businessId: true },
  });

  if (!media) {
    return { success: false, message: "Media not found." };
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { status: "REMOVED" },
  });

  await clearCoverLogoIfNeeded(mediaId, media.businessId, media.type);

  await logAdminAction(
    admin.id,
    "media.remove",
    "BusinessMedia",
    mediaId,
    `${media.status} → REMOVED`
  );

  const slug = await getBusinessSlug(media.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Media removed." };
}

export async function restoreMedia(
  mediaId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
    select: { status: true, businessId: true },
  });

  if (!media) {
    return { success: false, message: "Media not found." };
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { status: "ACTIVE" },
  });

  await logAdminAction(
    admin.id,
    "media.restore",
    "BusinessMedia",
    mediaId,
    `${media.status} → ACTIVE`
  );

  const slug = await getBusinessSlug(media.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Media restored." };
}

// ─── Review Actions ────────────────────────────────────────────

export async function adminApproveReview(
  reviewId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true, businessId: true },
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "APPROVED" },
  });

  await logAdminAction(
    admin.id,
    "review.approve",
    "Review",
    reviewId,
    `${review.status} → APPROVED`
  );

  const slug = await getBusinessSlug(review.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Review approved." };
}

export async function adminHideReview(
  reviewId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true, businessId: true },
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "HIDDEN" },
  });

  await logAdminAction(
    admin.id,
    "review.hide",
    "Review",
    reviewId,
    `${review.status} → HIDDEN`
  );

  const slug = await getBusinessSlug(review.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Review hidden." };
}

export async function adminRemoveReview(
  reviewId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true, businessId: true },
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "REMOVED" },
  });

  await logAdminAction(
    admin.id,
    "review.remove",
    "Review",
    reviewId,
    `${review.status} → REMOVED`
  );

  const slug = await getBusinessSlug(review.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Review removed." };
}

export async function adminRestoreReview(
  reviewId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true, businessId: true },
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "APPROVED" },
  });

  await logAdminAction(
    admin.id,
    "review.restore",
    "Review",
    reviewId,
    `${review.status} → APPROVED`
  );

  const slug = await getBusinessSlug(review.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Review restored." };
}

// ─── Category Actions ──────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes"),
  description: z.string().max(500).optional().or(z.literal("")),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export async function createCategory(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  try {
    const category = await db.businessCategory.create({
      data: {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description || null,
        imageUrl: result.data.imageUrl || null,
        sortOrder: result.data.sortOrder,
      },
    });

    await logAdminAction(
      admin.id,
      "category.create",
      "BusinessCategory",
      category.id,
      `name: ${category.name}`
    );

    revalidateAdmin();
    return { success: true, message: "Category created." };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        message: "A category with this slug already exists.",
      };
    }
    throw err;
  }
}

export async function updateCategory(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) {
    return { success: false, message: "Category ID is required." };
  }

  const result = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const existing = await db.businessCategory.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });

  if (!existing) {
    return { success: false, message: "Category not found." };
  }

  try {
    await db.businessCategory.update({
      where: { id: categoryId },
      data: {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description || null,
        imageUrl: result.data.imageUrl || null,
        sortOrder: result.data.sortOrder,
      },
    });

    await logAdminAction(
      admin.id,
      "category.update",
      "BusinessCategory",
      categoryId,
      `name: ${existing.name} → ${result.data.name}`
    );

    revalidateAdmin();
    return { success: true, message: "Category updated." };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        message: "A category with this slug already exists.",
      };
    }
    throw err;
  }
}

export async function deleteCategory(
  categoryId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const category = await db.businessCategory.findUnique({
    where: { id: categoryId },
    select: { name: true, _count: { select: { businesses: true } } },
  });

  if (!category) {
    return { success: false, message: "Category not found." };
  }

  if (category._count.businesses > 0) {
    return {
      success: false,
      message: `Cannot delete: ${category._count.businesses} business${category._count.businesses !== 1 ? "es" : ""} use this category.`,
    };
  }

  await db.businessCategory.delete({ where: { id: categoryId } });

  await logAdminAction(
    admin.id,
    "category.delete",
    "BusinessCategory",
    categoryId,
    `name: ${category.name}`
  );

  revalidateAdmin();
  return { success: true, message: "Category deleted." };
}

// ─── Style Tag Actions ─────────────────────────────────────────

const styleTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes"),
  description: z.string().max(500).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

function revalidateStyleTagPaths() {
  revalidatePath("/admin/style-tags");
  revalidatePath("/styles", "layout");
  revalidatePath("/explore");
}

export async function createStyleTag(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = styleTagSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  try {
    const tag = await db.styleTag.create({
      data: {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description || null,
        categoryId: result.data.categoryId || null,
        sortOrder: result.data.sortOrder,
      },
    });

    await logAdminAction(admin.id, "styleTag.create", "StyleTag", tag.id, `name: ${tag.name}`);
    revalidateStyleTagPaths();
    return { success: true, message: "Style tag created." };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return { success: false, message: "A style tag with this slug already exists." };
    }
    throw err;
  }
}

export async function updateStyleTag(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const styleTagId = formData.get("styleTagId") as string;
  if (!styleTagId) return { success: false, message: "Style tag ID is required." };

  const result = styleTagSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const existing = await db.styleTag.findUnique({ where: { id: styleTagId }, select: { name: true, slug: true } });
  if (!existing) return { success: false, message: "Style tag not found." };

  try {
    await db.styleTag.update({
      where: { id: styleTagId },
      data: {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description || null,
        categoryId: result.data.categoryId || null,
        sortOrder: result.data.sortOrder,
      },
    });

    await logAdminAction(admin.id, "styleTag.update", "StyleTag", styleTagId, `${existing.name} → ${result.data.name}`);
    revalidateStyleTagPaths();
    if (existing.slug !== result.data.slug) revalidatePath(`/styles/${existing.slug}`);
    revalidatePath(`/styles/${result.data.slug}`);
    return { success: true, message: "Style tag updated." };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return { success: false, message: "A style tag with this slug already exists." };
    }
    throw err;
  }
}

export async function toggleStyleTagActive(styleTagId: string): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const tag = await db.styleTag.findUnique({ where: { id: styleTagId }, select: { isActive: true, name: true } });
  if (!tag) return { success: false, message: "Style tag not found." };

  const next = !tag.isActive;
  await db.styleTag.update({ where: { id: styleTagId }, data: { isActive: next } });
  await logAdminAction(admin.id, "styleTag.toggle", "StyleTag", styleTagId, `isActive: ${tag.isActive} → ${next}`);
  revalidateStyleTagPaths();
  return { success: true, message: next ? "Style tag activated." : "Style tag deactivated." };
}

export async function deleteStyleTag(styleTagId: string): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const tag = await db.styleTag.findUnique({
    where: { id: styleTagId },
    select: { name: true, _count: { select: { posts: true } } },
  });

  if (!tag) return { success: false, message: "Style tag not found." };

  if (tag._count.posts > 0) {
    return {
      success: false,
      message: `${tag._count.posts} gönderi bu etiketi kullanıyor. Silmek yerine devre dışı bırakın.`,
    };
  }

  await db.styleTag.delete({ where: { id: styleTagId } });
  await logAdminAction(admin.id, "styleTag.delete", "StyleTag", styleTagId, `name: ${tag.name}`);
  revalidateStyleTagPaths();
  return { success: true, message: "Style tag deleted." };
}

// ─── Post Moderation ────────────────────────────────────────────

export async function adminSetPostStatus(
  postId: string,
  status: PostStatus
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { status: true, businessId: true },
  });

  if (!post) {
    return { success: false, message: "Post not found." };
  }

  await db.post.update({ where: { id: postId }, data: { status } });

  await logAdminAction(
    admin.id,
    "post.set_status",
    "Post",
    postId,
    `${post.status} → ${status}`
  );

  revalidatePath("/admin/posts");
  revalidatePath("/explore");

  return { success: true, message: `Post status set to ${status}.` };
}
