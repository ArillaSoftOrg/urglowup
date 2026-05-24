import { db } from "@/lib/db";
import type { PostMediaType } from "@/generated/prisma/enums";

export type ExplorePost = {
  id: string;
  description: string | null;
  createdAt: Date;
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  media: Array<{
    url: string;
    type: PostMediaType;
    sortOrder: number;
    width: number | null;
    height: number | null;
    duration: number | null;
  }>;
  relatedService: { name: string } | null;
  category: { name: string; slug: string } | null;
  savedByCurrentUser: boolean;
  saveCount: number;
};

export async function getExplorePosts(opts: {
  categoryId?: string;
  cursor?: string;
  take?: number;
  userId?: string;
}): Promise<{ posts: ExplorePost[]; nextCursor: string | null }> {
  const take = opts.take ?? 20;

  const rows = await db.post.findMany({
    where: {
      status: "ACTIVE",
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts.cursor
        ? { createdAt: { lt: new Date(opts.cursor) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    select: {
      id: true,
      description: true,
      createdAt: true,
      business: {
        select: { id: true, name: true, slug: true, logoUrl: true },
      },
      media: {
        orderBy: { sortOrder: "asc" },
        select: {
          url: true,
          type: true,
          sortOrder: true,
          width: true,
          height: true,
          duration: true,
        },
      },
      relatedService: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { saves: true } },
    },
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;

  // Batch-check which posts the current user has saved
  let savedPostIds = new Set<string>();
  if (opts.userId && items.length > 0) {
    const saves = await db.postSave.findMany({
      where: {
        userId: opts.userId,
        postId: { in: items.map((p) => p.id) },
      },
      select: { postId: true },
    });
    savedPostIds = new Set(saves.map((s) => s.postId));
  }

  const posts: ExplorePost[] = items.map((row) => ({
    id: row.id,
    description: row.description,
    createdAt: row.createdAt,
    business: row.business,
    media: row.media,
    relatedService: row.relatedService,
    category: row.category,
    savedByCurrentUser: savedPostIds.has(row.id),
    saveCount: row._count.saves,
  }));

  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return { posts, nextCursor };
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
