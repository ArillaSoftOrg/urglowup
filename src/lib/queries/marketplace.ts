import { db } from "@/lib/db";

// ─── Shared filter ─────────────────────────────────────────────

const ACTIVE_VISIBLE = {
  status: "ACTIVE_MARKETPLACE" as const,
  isMarketplaceVisible: true,
};

// ─── Types ─────────────────────────────────────────────────────

export type MarketplaceBusiness = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  categories: Array<{ category: { name: string; slug: string } }>;
  /** Count of approved UrGlowUp reviews */
  reviewCount: number;
  /** Average rating (1–5), or null if no reviews */
  reviewAvg: number | null;
};

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  /** Count of active visible businesses in this category */
  businessCount: number;
};

export type MarketplaceCity = {
  city: string;
  count: number;
};

// ─── Queries ───────────────────────────────────────────────────

interface BusinessFilters {
  categorySlug?: string;
  city?: string;
  district?: string;
}

/**
 * Returns marketplace businesses that are ACTIVE_MARKETPLACE + isMarketplaceVisible.
 * Optional filters: categorySlug, city (case-insensitive), district (case-insensitive).
 * Hard limit: 50 results. Ordered newest first.
 */
export async function getMarketplaceBusinesses(
  filters: BusinessFilters = {}
): Promise<MarketplaceBusiness[]> {
  const { categorySlug, city, district } = filters;

  const raw = await db.business.findMany({
    where: {
      ...ACTIVE_VISIBLE,
      ...(categorySlug && {
        categories: { some: { category: { slug: categorySlug } } },
      }),
      ...(city && {
        city: { equals: city, mode: "insensitive" },
      }),
      ...(district && {
        district: { equals: district, mode: "insensitive" },
      }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImageUrl: true,
      logoUrl: true,
      city: true,
      district: true,
      categories: {
        select: {
          category: { select: { name: true, slug: true } },
        },
      },
      reviews: {
        where: { status: "APPROVED", source: "URGLOWUP" },
        select: { rating: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Phase 10 limit — pagination added in a later phase
  });

  return raw.map((b) => {
    const reviewCount = b.reviews.length;
    const reviewAvg =
      reviewCount > 0
        ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reviews: _reviews, ...rest } = b;
    return { ...rest, reviewCount, reviewAvg };
  });
}

/**
 * Returns all categories ordered by sortOrder, with a count of active visible
 * businesses in each category.
 */
export async function getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  const categories = await db.businessCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          businesses: {
            where: {
              business: ACTIVE_VISIBLE,
            },
          },
        },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    sortOrder: c.sortOrder,
    businessCount: c._count.businesses,
  }));
}

/**
 * Returns distinct cities that have at least one active visible business,
 * sorted by business count descending.
 */
export async function getMarketplaceCities(): Promise<MarketplaceCity[]> {
  const result = await db.business.groupBy({
    by: ["city"],
    where: {
      ...ACTIVE_VISIBLE,
      city: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return result
    .filter((r): r is typeof r & { city: string } => r.city !== null)
    .map((r) => ({ city: r.city, count: r._count.id }));
}

/**
 * Fetches a single category by slug, or null if not found.
 */
export async function getMarketplaceCategoryBySlug(slug: string) {
  return db.businessCategory.findUnique({ where: { slug } });
}

/**
 * Returns distinct city+district combos for active visible businesses
 * that have a non-null district. Used by generateStaticParams.
 */
export async function getMarketplaceDistricts(): Promise<
  Array<{ city: string; district: string }>
> {
  const rows = await db.business.findMany({
    where: {
      ...ACTIVE_VISIBLE,
      district: { not: null },
      city: { not: null },
    },
    select: { city: true, district: true },
    distinct: ["city", "district"],
  });

  return rows.filter(
    (r): r is { city: string; district: string } =>
      r.city !== null && r.district !== null
  );
}
