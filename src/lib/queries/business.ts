import { db } from "@/lib/db";
import { getCached, setCached } from "@/lib/cache";

async function fetchBusinessBySlug(slug: string) {
  return db.business.findUnique({
    where: { slug },
    include: {
      categories: {
        include: { category: true },
      },
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      media: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: {
            select: { firstName: true, lastName: true, avatarUrl: true },
          },
        },
      },
      hours: {
        orderBy: { dayOfWeek: "asc" },
      },
      professionals: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          displayName: true,
          title: true,
          bio: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          reviews: { where: { status: "APPROVED" } },
          appointments: true,
        },
      },
    },
  });
}

type BusinessBySlugResult = Awaited<ReturnType<typeof fetchBusinessBySlug>>;

export async function getBusinessBySlug(
  slug: string
): Promise<BusinessBySlugResult> {
  // Check cache first
  const cacheKey = `business:slug:${slug}`;
  const cached = await getCached<NonNullable<BusinessBySlugResult>>(cacheKey);
  if (cached) {
    return cached;
  }

  const business = await fetchBusinessBySlug(slug);

  // Cache for 5 minutes (business profile changes less frequently)
  if (business) {
    await setCached(cacheKey, business, { ttlSeconds: 300 });
  }

  return business;
}

export type BusinessWithDetails = NonNullable<
  Awaited<ReturnType<typeof getBusinessBySlug>>
>;

export async function getBusinessForPublicLink(businessId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [business, viewRows] = await Promise.all([
    db.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        slug: true,
        status: true,
        description: true,
        phone: true,
        whatsapp: true,
        city: true,
        district: true,
        address: true,
        coverImageUrl: true,
        logoUrl: true,
        categories: { select: { categoryId: true } },
        services: {
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { sortOrder: "asc" },
        },
        hours: { where: { isOpen: true }, select: { id: true } },
        media: {
          where: {
            status: "ACTIVE",
            type: { in: ["PORTFOLIO_IMAGE", "PORTFOLIO_VIDEO", "BEFORE_AFTER"] },
          },
          select: { id: true },
        },
      },
    }),
    db.businessPageView.groupBy({
      by: ["source"],
      where: { businessId, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
    }),
  ]);

  if (!business) return null;

  const bySource = viewRows.map((r) => ({ source: r.source, count: r._count.id }));
  const total = bySource.reduce((sum, r) => sum + r.count, 0);

  return { ...business, viewStats: { total, bySource } };
}

export type BusinessForPublicLink = NonNullable<
  Awaited<ReturnType<typeof getBusinessForPublicLink>>
>;

async function fetchGoogleReviewsForBusiness(businessId: string) {
  return db.externalReviewCache.findMany({
    where: {
      businessId,
      provider: "GOOGLE_BUSINESS_PROFILE",
      expiresAt: { gt: new Date() }, // Only non-expired reviews
    },
    orderBy: { createTime: "desc" },
    take: 10,
  });
}

export type GoogleReview = Awaited<
  ReturnType<typeof fetchGoogleReviewsForBusiness>
>[number];

export async function getGoogleReviewsForBusiness(
  businessId: string
): Promise<GoogleReview[]> {
  // Check cache first
  const cacheKey = `reviews:google:${businessId}`;
  const cached = await getCached<GoogleReview[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const reviews = await fetchGoogleReviewsForBusiness(businessId);

  // Cache for 1 hour (reviews don't change frequently)
  if (reviews.length > 0) {
    await setCached(cacheKey, reviews, { ttlSeconds: 3600 });
  }

  return reviews;
}
