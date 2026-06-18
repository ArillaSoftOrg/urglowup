import { db } from "@/lib/db";
import { getCached, setCached, invalidateCache } from "@/lib/cache";

export async function getBusinessBySlug(slug: string) {
  // Check cache first
  const cacheKey = `business:slug:${slug}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const business = await db.business.findUnique({
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
      _count: {
        select: {
          reviews: { where: { status: "APPROVED" } },
          appointments: true,
        },
      },
    },
  });

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
  return db.business.findUnique({
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
      services: { where: { isActive: true }, select: { id: true } },
      hours: { where: { isOpen: true }, select: { id: true } },
      media: {
        where: {
          status: "ACTIVE",
          type: { in: ["PORTFOLIO_IMAGE", "PORTFOLIO_VIDEO", "BEFORE_AFTER"] },
        },
        select: { id: true },
      },
    },
  });
}

export type BusinessForPublicLink = NonNullable<
  Awaited<ReturnType<typeof getBusinessForPublicLink>>
>;

export async function getGoogleReviewsForBusiness(businessId: string) {
  // Check cache first
  const cacheKey = `reviews:google:${businessId}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const reviews = await db.externalReviewCache.findMany({
    where: {
      businessId,
      provider: "GOOGLE_BUSINESS_PROFILE",
      expiresAt: { gt: new Date() }, // Only non-expired reviews
    },
    orderBy: { createTime: "desc" },
    take: 10,
  });

  // Cache for 1 hour (reviews don't change frequently)
  if (reviews.length > 0) {
    await setCached(cacheKey, reviews, { ttlSeconds: 3600 });
  }

  return reviews;
}

export type GoogleReview = {
  id: string;
  businessId: string;
  provider: string;
  providerReviewId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  rating: number;
  comment?: string | null;
  merchantReply?: string | null;
  createTime: Date;
  fetchedAt: Date;
  expiresAt: Date;
  visibilityStatus: string;
  displayOrder: number;
  isFeaturedByBusiness: boolean;
  createdAt: Date;
  updatedAt: Date;
};
