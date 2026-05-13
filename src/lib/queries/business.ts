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
