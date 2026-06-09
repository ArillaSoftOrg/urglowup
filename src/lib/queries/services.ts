import { db } from "@/lib/db";

const ACTIVE_VISIBLE_BUSINESS = {
  status: "ACTIVE_MARKETPLACE" as const,
  isMarketplaceVisible: true,
};

/**
 * Fetches a single active service by slug, including its parent business
 * (for breadcrumbs/contact/location), the business's categories, and any
 * media linked directly to the service. Returns null if the service, its
 * business, or the business's marketplace visibility doesn't qualify.
 */
export async function getServiceBySlug(slug: string) {
  const service = await db.businessService.findUnique({
    where: { slug },
    include: {
      business: {
        include: {
          categories: { include: { category: true } },
          media: {
            where: { status: "ACTIVE", type: { in: ["COVER", "LOGO"] } },
            select: {
              type: true,
              publicId: true,
              cropX: true,
              cropY: true,
              cropWidth: true,
              cropHeight: true,
            },
          },
        },
      },
      media: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!service) return null;
  if (
    service.business.status !== ACTIVE_VISIBLE_BUSINESS.status ||
    !service.business.isMarketplaceVisible ||
    !service.isActive
  ) {
    return null;
  }

  return service;
}

export type ServiceWithDetails = NonNullable<
  Awaited<ReturnType<typeof getServiceBySlug>>
>;

/**
 * Returns slugs and last-modified timestamps for all services belonging to
 * active visible businesses. Used exclusively by the sitemap — no row limit.
 */
export async function getAllServiceSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  return db.businessService.findMany({
    where: {
      isActive: true,
      business: ACTIVE_VISIBLE_BUSINESS,
    },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
