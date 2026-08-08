import { db } from "@urglowup/db";

export async function getReviewableAppointments(userId: string) {
  return db.appointment.findMany({
    where: {
      customerId: userId,
      status: "COMPLETED",
      review: null,
    },
    include: {
      business: { select: { name: true, slug: true } },
      service: { select: { name: true } },
    },
    orderBy: { requestedDate: "desc" },
  });
}

export type ReviewableAppointment = Awaited<ReturnType<typeof getReviewableAppointments>>[number];

export async function getCustomerReviews(userId: string) {
  return db.review.findMany({
    where: { customerId: userId, source: "URGLOWUP" },
    include: {
      business: { select: { name: true, slug: true } },
      appointment: {
        select: {
          requestedDate: true,
          requestedTime: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type CustomerReview = Awaited<ReturnType<typeof getCustomerReviews>>[number];

/** Cursor-paginated variant for API v1 — getCustomerReviews above is unbounded. */
export async function listCustomerReviews(
  userId: string,
  options: { cursor?: string; limit: number },
) {
  const rows = await db.review.findMany({
    where: { customerId: userId, source: "URGLOWUP" },
    include: {
      business: { select: { name: true, slug: true } },
      appointment: {
        select: {
          requestedDate: true,
          requestedTime: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > options.limit;
  const data = hasMore ? rows.slice(0, options.limit) : rows;
  return { data, nextCursor: hasMore ? data[data.length - 1].id : null };
}

export async function getBusinessReviews(businessId: string) {
  return db.review.findMany({
    where: { businessId },
    include: {
      customer: {
        select: { firstName: true, lastName: true, avatarUrl: true },
      },
      appointment: {
        select: {
          requestedDate: true,
          requestedTime: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type BusinessReview = Awaited<ReturnType<typeof getBusinessReviews>>[number];

/** Cursor-paginated variant for API v1 — getBusinessReviews above is unbounded. */
export async function listBusinessReviews(
  businessId: string,
  options: { cursor?: string; limit: number },
) {
  const rows = await db.review.findMany({
    where: { businessId, status: "APPROVED" },
    include: {
      customer: {
        select: { firstName: true, lastName: true, avatarUrl: true },
      },
      appointment: {
        select: {
          requestedDate: true,
          requestedTime: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > options.limit;
  const data = hasMore ? rows.slice(0, options.limit) : rows;
  return { data, nextCursor: hasMore ? data[data.length - 1].id : null };
}

export async function getBusinessReviewStats(businessId: string) {
  const [reviews, cachedStats] = await Promise.all([
    db.review.findMany({
      where: { businessId, status: "APPROVED", source: "URGLOWUP" },
      select: { rating: true },
    }),
    db.businessRatingStats.findUnique({
      where: { businessId },
      select: { bayesianScore: true, rawReviewCount: true },
    }),
  ]);

  const totalCount = reviews.length;
  const rawAverage =
    totalCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount : null;

  // Prefer Bayesian score as the displayed average when available
  const averageRating = cachedStats?.bayesianScore ?? rawAverage;

  // Distribution by star tier: 1–5 stars, each star = 2 points on the 0–10 scale
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.ceil(r.rating / 2)));
    ratingDistribution[star] = (ratingDistribution[star] ?? 0) + 1;
  }

  return {
    averageRating,
    totalCount: cachedStats?.rawReviewCount ?? totalCount,
    ratingDistribution,
  };
}

export async function getBusinessReviewSummary(businessId: string) {
  // Prefer precomputed Bayesian score when available
  const cached = await db.businessRatingStats.findUnique({
    where: { businessId },
    select: { bayesianScore: true, rawReviewCount: true },
  });

  if (cached?.bayesianScore != null) {
    return { averageRating: cached.bayesianScore, totalCount: cached.rawReviewCount };
  }

  // Fallback to raw aggregate (0–10 scale after migration)
  const aggregate = await db.review.aggregate({
    where: { businessId, status: "APPROVED", source: "URGLOWUP" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    averageRating: aggregate._avg.rating,
    totalCount: aggregate._count.rating,
  };
}

export async function getBusinessRatingStatsCached(businessId: string) {
  return db.businessRatingStats.findUnique({ where: { businessId } });
}
