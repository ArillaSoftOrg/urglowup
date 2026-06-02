import { db } from "@/lib/db";
import { getExplorePosts } from "./posts";
import type { ExplorePost } from "./posts";
import {
  optimizeBusinessLogoUrl,
  optimizePostImageUrl,
} from "@/lib/optimized-media";

export type StyleTagSummary = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  postCount: number;
  coverUrl: string | null;
};

export type StyleTagDetail = StyleTagSummary & {
  description: string | null;
  category: { id: string; name: string; slug: string } | null;
  sortOrder: number;
  isActive: boolean;
};

export type AdminStyleTag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  category: { name: string } | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  postCount: number;
};

export type StyleTagBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
};

export async function getAllStyleTags(): Promise<StyleTagSummary[]> {
  const tags = await db.styleTag.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      _count: { select: { posts: { where: { post: { status: "ACTIVE" } } } } },
      posts: {
        take: 1,
        orderBy: { assignedAt: "desc" },
        where: { post: { status: "ACTIVE" } },
        select: {
          post: {
            select: {
              media: {
                take: 1,
                orderBy: { sortOrder: "asc" },
                select: { url: true, publicId: true, type: true },
              },
            },
          },
        },
      },
    },
  });

  return tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    categoryId: t.categoryId,
    postCount: t._count.posts,
    coverUrl: t.posts[0]?.post.media[0]
      ? optimizePostImageUrl(t.posts[0].post.media[0], t.posts[0].post.media[0].url, 720)
      : null,
  }));
}

export async function getStyleTagBySlug(slug: string): Promise<StyleTagDetail | null> {
  const tag = await db.styleTag.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      categoryId: true,
      isActive: true,
      sortOrder: true,
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { posts: { where: { post: { status: "ACTIVE" } } } } },
      posts: {
        take: 1,
        orderBy: { assignedAt: "desc" },
        where: { post: { status: "ACTIVE" } },
        select: {
          post: {
            select: {
              media: {
                take: 1,
                orderBy: { sortOrder: "asc" },
                select: { url: true, publicId: true, type: true },
              },
            },
          },
        },
      },
    },
  });

  if (!tag) return null;

  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    categoryId: tag.categoryId,
    isActive: tag.isActive,
    sortOrder: tag.sortOrder,
    category: tag.category,
    postCount: tag._count.posts,
    coverUrl: tag.posts[0]?.post.media[0]
      ? optimizePostImageUrl(tag.posts[0].post.media[0], tag.posts[0].post.media[0].url, 720)
      : null,
  };
}

export async function getStyleTagBusinesses(styleTagId: string): Promise<StyleTagBusiness[]> {
  const rows = await db.post.findMany({
    where: {
      status: "ACTIVE",
      styleTags: { some: { styleTagId } },
    },
    select: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          city: true,
          media: {
            where: {
              status: "ACTIVE",
              type: "LOGO",
            },
            select: {
              type: true,
              publicId: true,
              cropX: true,
              cropY: true,
              cropWidth: true,
              cropHeight: true,
            },
            take: 1,
          },
        },
      },
    },
    distinct: ["businessId"],
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.business.id,
    name: r.business.name,
    slug: r.business.slug,
    logoUrl: optimizeBusinessLogoUrl(r.business.media[0], r.business.logoUrl, 80),
    city: r.business.city,
  }));
}

export async function getStyleTagPosts(
  styleTagId: string,
  opts: { take?: number; cursor?: string; userId?: string }
): Promise<{ posts: ExplorePost[]; nextCursor: string | null }> {
  return getExplorePosts({ styleTagId, ...opts });
}

export async function getAdminStyleTags(): Promise<AdminStyleTag[]> {
  const tags = await db.styleTag.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      categoryId: true,
      category: { select: { name: true } },
      isActive: true,
      sortOrder: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  return tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    categoryId: t.categoryId,
    category: t.category,
    isActive: t.isActive,
    sortOrder: t.sortOrder,
    createdAt: t.createdAt,
    postCount: t._count.posts,
  }));
}
