import { db } from "@/lib/db";

export async function getBusinessBySlug(slug: string) {
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
      _count: {
        select: {
          reviews: { where: { status: "APPROVED" } },
          appointments: true,
        },
      },
    },
  });
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
  ReturnType<typeof getGoogleReviewsForBusiness>
>[number];
