import { db } from "@/lib/db";

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

export type ReviewableAppointment = Awaited<
  ReturnType<typeof getReviewableAppointments>
>[number];

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

export type CustomerReview = Awaited<
  ReturnType<typeof getCustomerReviews>
>[number];

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

export type BusinessReview = Awaited<
  ReturnType<typeof getBusinessReviews>
>[number];

export async function getBusinessReviewStats(businessId: string) {
  const [aggregate, distribution] = await Promise.all([
    db.review.aggregate({
      where: { businessId, status: "APPROVED", source: "URGLOWUP" },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    db.review.groupBy({
      by: ["rating"],
      where: { businessId, status: "APPROVED", source: "URGLOWUP" },
      _count: { rating: true },
    }),
  ]);

  const ratingDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const row of distribution) {
    ratingDistribution[row.rating] = row._count.rating;
  }

  return {
    averageRating: aggregate._avg.rating,
    totalCount: aggregate._count.rating,
    ratingDistribution,
  };
}

export async function getBusinessReviewSummary(businessId: string) {
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
