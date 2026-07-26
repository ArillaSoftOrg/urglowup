import { db } from "@/lib/db";
import { getCached, setCached } from "@/lib/cache";
import {
  fetchGooglePlacesReviews,
  type GooglePlacesReview,
  type GooglePlacesReviewData,
} from "@/lib/external/google/places-reviews";

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
        include: {
          relatedService: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              price: true,
              priceType: true,
              salePrice: true,
              saleEndsAt: true,
            },
          },
        },
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
          user: {
            select: { avatarUrl: true },
          },
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
  const cacheKey = `business:v2:slug:${slug}`;
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

export type BusinessMediaEngagement = {
  likeCount: number;
  likedByCurrentUser: boolean;
};

export async function getBusinessMediaEngagement(
  mediaIds: string[],
  userId?: string,
): Promise<Record<string, BusinessMediaEngagement>> {
  if (mediaIds.length === 0) return {};

  const [counts, userLikes] = await Promise.all([
    db.businessMediaLike.groupBy({
      by: ["mediaId"],
      where: { mediaId: { in: mediaIds } },
      _count: { mediaId: true },
    }),
    userId
      ? db.businessMediaLike.findMany({
          where: { userId, mediaId: { in: mediaIds } },
          select: { mediaId: true },
        })
      : Promise.resolve([]),
  ]);

  const liked = new Set(userLikes.map((item) => item.mediaId));
  const result: Record<string, BusinessMediaEngagement> = {};

  for (const mediaId of mediaIds) {
    const count = counts.find((item) => item.mediaId === mediaId);
    result[mediaId] = {
      likeCount: count?._count.mediaId ?? 0,
      likedByCurrentUser: liked.has(mediaId),
    };
  }

  return result;
}

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

async function fetchCachedGoogleReviewsForBusiness(businessId: string) {
  const reviews = await db.externalReviewCache.findMany({
    where: {
      businessId,
      provider: "GOOGLE_BUSINESS_PROFILE",
      visibilityStatus: "VISIBLE",
      expiresAt: { gt: new Date() }, // Only non-expired reviews
      connection: {
        is: {
          status: "ACTIVE",
          showExternalReviews: true,
        },
      },
    },
    orderBy: { createTime: "desc" },
    take: 10,
  });

  const normalizedReviews = reviews.map(
    (review): GoogleReview => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      originalComment: null,
      isTranslated: false,
      reviewerDisplayName: review.reviewerDisplayName,
      reviewerProfilePhotoUrl: review.reviewerProfilePhotoUrl,
      reviewerProfileUrl: null,
      createTime: review.createTime,
      relativePublishTimeDescription: null,
      merchantReply: review.merchantReply,
      attribution: "Google Maps",
      sourceUrl: review.sourceUrl,
      reportUrl: null,
    }),
  );

  return {
    reviews: normalizedReviews,
    averageRating:
      normalizedReviews.length > 0
        ? normalizedReviews.reduce((sum, review) => sum + review.rating, 0) /
          normalizedReviews.length
        : null,
    totalCount: normalizedReviews.length,
  } satisfies GoogleReviewData;
}

export type GoogleReview = GooglePlacesReview;
export type GoogleReviewData = GooglePlacesReviewData;

export async function getGoogleReviewsForBusiness(
  businessId: string,
  options?: {
    placeId?: string | null;
    languageCode?: string;
  },
): Promise<GoogleReviewData> {
  if (options?.placeId) {
    const placeReviewData = await fetchGooglePlacesReviews(
      options.placeId,
      options.languageCode,
    );
    if (placeReviewData.reviews.length > 0) return placeReviewData;
  }

  return fetchCachedGoogleReviewsForBusiness(businessId);
}
