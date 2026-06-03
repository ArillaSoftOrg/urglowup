import { db } from "@/lib/db";
import type { PostContentType, PostMediaType } from "@/generated/prisma/enums";
import {
  optimizeBusinessLogoUrl,
  optimizePostImageUrl,
  optimizePostVideoPosterUrl,
  optimizePostViewerImageUrl,
} from "@/lib/optimized-media";

export type ExplorePost = {
  id: string;
  description: string | null;
  contentType: PostContentType;
  createdAt: Date;
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  media: Array<{
    url: string;
    viewerUrl: string;
    posterUrl: string | null;
    type: PostMediaType;
    publicId: string;
    sortOrder: number;
    width: number | null;
    height: number | null;
    duration: number | null;
  }>;
  relatedService: { name: string } | null;
  category: { name: string; slug: string } | null;
  styleTags: Array<{ id: string; name: string; slug: string }>;
  savedByCurrentUser: boolean;
  saveCount: number;
};

const POST_SELECT = {
  id: true,
  categoryId: true, // used for personalization re-sort; not exposed in ExplorePost
  description: true,
  contentType: true,
  createdAt: true,
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      media: {
        where: {
          status: "ACTIVE" as const,
          type: "LOGO" as const,
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
  media: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      url: true,
      publicId: true,
      type: true,
      sortOrder: true,
      width: true,
      height: true,
      duration: true,
    },
  },
  relatedService: { select: { name: true } },
  category: { select: { name: true, slug: true } },
  styleTags: {
    select: { styleTag: { select: { id: true, name: true, slug: true } } },
  },
  _count: { select: { saves: true } },
} as const;

type RawPost = Awaited<ReturnType<typeof db.post.findMany<{ select: typeof POST_SELECT }>>>[number];

function mapPost(row: RawPost, savedPostIds: Set<string>): ExplorePost {
  const logoMedia = row.business.media[0];

  return {
    id: row.id,
    description: row.description,
    contentType: row.contentType,
    createdAt: row.createdAt,
    business: {
      id: row.business.id,
      name: row.business.name,
      slug: row.business.slug,
      logoUrl: optimizeBusinessLogoUrl(logoMedia, row.business.logoUrl, 80),
    },
    media: row.media.map((item) => ({
      ...item,
      url: optimizePostImageUrl(item, item.url),
      viewerUrl: optimizePostViewerImageUrl(item, item.url),
      posterUrl: optimizePostVideoPosterUrl(item),
    })),
    relatedService: row.relatedService,
    category: row.category,
    styleTags: row.styleTags.map((pt) => pt.styleTag),
    savedByCurrentUser: savedPostIds.has(row.id),
    saveCount: row._count.saves,
  };
}

export async function getExplorePosts(opts: {
  categoryId?: string;
  styleTagId?: string;
  cursor?: string;
  take?: number;
  userId?: string;
  includePromotions?: boolean;
  /** Ranked category IDs from UserPreferences.preferredCategoryIds — first page only */
  preferredCategoryIds?: string[];
}): Promise<{ posts: ExplorePost[]; nextCursor: string | null }> {
  const take = opts.take ?? 20;

  const baseWhere = {
    status: "ACTIVE" as const,
    ...(opts.includePromotions ? {} : { contentType: { not: "PROMOTION" as const } }),
    ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
    ...(opts.styleTagId ? { styleTags: { some: { styleTagId: opts.styleTagId } } } : {}),
  };

  // ── Two-phase personalization (first page only, no cursor, no explicit filters) ──
  const canPersonalize =
    !opts.cursor &&
    !opts.categoryId &&
    !opts.styleTagId &&
    opts.preferredCategoryIds &&
    opts.preferredCategoryIds.length > 0;

  if (canPersonalize) {
    const preferredIds = new Set(opts.preferredCategoryIds!);

    const rows = await db.post.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      select: POST_SELECT,
    });

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;

    // Stable re-sort: preferred-category posts first, then discovery; createdAt order preserved within each group
    const preferred = items.filter((r) => r.categoryId !== null && preferredIds.has(r.categoryId));
    const discovery = items.filter((r) => r.categoryId === null || !preferredIds.has(r.categoryId));
    const sorted = [...preferred, ...discovery];

    let savedPostIds = new Set<string>();
    if (opts.userId && sorted.length > 0) {
      const saves = await db.postSave.findMany({
        where: { userId: opts.userId, postId: { in: sorted.map((p) => p.id) } },
        select: { postId: true },
      });
      savedPostIds = new Set(saves.map((s) => s.postId));
    }

    // Cursor anchored to the last item in original createdAt order so subsequent pages continue correctly
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      posts: sorted.map((row) => mapPost(row, savedPostIds)),
      nextCursor,
    };
  }

  // ── Standard reverse-chronological feed ──────────────────────────
  const rows = await db.post.findMany({
    where: {
      ...baseWhere,
      ...(opts.cursor ? { createdAt: { lt: new Date(opts.cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    select: POST_SELECT,
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;

  let savedPostIds = new Set<string>();
  if (opts.userId && items.length > 0) {
    const saves = await db.postSave.findMany({
      where: { userId: opts.userId, postId: { in: items.map((p) => p.id) } },
      select: { postId: true },
    });
    savedPostIds = new Set(saves.map((s) => s.postId));
  }

  const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

  return {
    posts: items.map((row) => mapPost(row, savedPostIds)),
    nextCursor,
  };
}

export async function getBusinessPosts(businessId: string) {
  return db.post.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      relatedService: { select: { name: true } },
      category: { select: { name: true } },
      _count: { select: { saves: true } },
    },
  });
}
