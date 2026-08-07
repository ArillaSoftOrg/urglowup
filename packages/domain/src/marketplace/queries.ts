import "server-only";

import { db, type Prisma } from "@urglowup/db";
import { optimizeBusinessCoverUrl, optimizeBusinessLogoUrl } from "./media";
import { getDayOfWeek, nowInBusinessTimezone } from "./timezone";
import type { MapBounds } from "./map-place";
import {
  MARKETPLACE_SORTS,
  isNewToUrGlowUp,
  parseMarketplaceLaunchAt,
  rankMarketplaceBusinesses,
  type DiscoveryBusiness,
  type MarketplaceSort,
} from "./ranking";

// ─── Shared filter ─────────────────────────────────────────────

const ACTIVE_VISIBLE = {
  status: "ACTIVE_MARKETPLACE" as const,
  isMarketplaceVisible: true,
};

// ─── Types ─────────────────────────────────────────────────────

export type MarketplaceBusiness = DiscoveryBusiness & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  /** Count of approved UrGlowUp reviews */
  reviewCount: number;
  /** Bayesian-adjusted average rating (0–10), or null if no reviews */
  reviewAvg: number | null;
  /** Lowest active service price (real data, from BusinessService.price), or null/undefined if none priced. */
  startingPrice?: number | null;
};

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  colorHex?: string | null;
  iconName?: string | null;
  sortOrder: number;
  /** Count of active visible businesses in this category */
  businessCount: number;
};

export type MarketplaceCity = {
  city: string;
  count: number;
};

// ─── Queries ───────────────────────────────────────────────────

export interface BusinessFilters {
  categorySlug?: string;
  city?: string;
  district?: string;
  /** Free-text search: business name, description, city, district, service names, category names */
  q?: string;
  /** Minimum Bayesian rating (post-query filter). One of: 6, 8, 9 */
  minRating?: number;
  /** Require at least one active portfolio/before-after media item */
  hasMedia?: boolean;
  /** Require at least one day marked isOpen */
  hasHours?: boolean;
  /** When the business should plausibly be open: today, tomorrow, weekend, or evening (closes after 18:00) */
  availability?: "today" | "tomorrow" | "weekend" | "evening";
  /** Minimum price (TRY) of at least one active service */
  priceMin?: number;
  /** Maximum price (TRY) of at least one active service */
  priceMax?: number;
  /** Require at least one active service with durationMinutes <= maxDuration */
  maxDuration?: number;
  /** Minimum number of approved reviews */
  minReviewCount?: number;
  /** Result ordering. Defaults to balanced marketplace recommendation. */
  sort?: MarketplaceSort;
  /** Optional visible map area. Longitude supports antimeridian-crossing bounds. */
  bounds?: MapBounds;
  /** Result cap. Defaults to 50 and is clamped to 250. */
  limit?: number;
}

// ─── Filter parser ──────────────────────────────────────────────

const VALID_MIN_RATINGS = [6, 8, 9] as const;
type ValidMinRating = (typeof VALID_MIN_RATINGS)[number];

const VALID_AVAILABILITY = ["today", "tomorrow", "weekend", "evening"] as const;
type ValidAvailability = (typeof VALID_AVAILABILITY)[number];

export interface ParsedFilters {
  q?: string;
  categorySlug?: string;
  city?: string;
  district?: string;
  minRating?: ValidMinRating;
  hasMedia: boolean;
  hasHours: boolean;
  availability?: ValidAvailability;
  priceMin?: number;
  priceMax?: number;
  maxDuration?: number;
  minReviewCount?: number;
  sort: MarketplaceSort;
}

/**
 * Safely parses raw searchParams into validated filter values.
 * Trims strings, rejects empty values, and allowlists minRating/availability.
 */
export function parseMarketplaceFilters(
  raw: Record<string, string | string[] | undefined>
): ParsedFilters {
  function str(key: string): string | undefined {
    const v = raw[key];
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  }

  /** Parses a positive integer within [min, max], or undefined if invalid/out of range */
  function positiveInt(key: string, min: number, max: number): number | undefined {
    const raw = str(key);
    if (raw === undefined) return undefined;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
  }

  const ratingNum = parseFloat(str("minRating") ?? "");
  const minRating = VALID_MIN_RATINGS.includes(ratingNum as ValidMinRating)
    ? (ratingNum as ValidMinRating)
    : undefined;

  const availabilityRaw = str("availability");
  const availability = VALID_AVAILABILITY.includes(availabilityRaw as ValidAvailability)
    ? (availabilityRaw as ValidAvailability)
    : undefined;

  const priceMin = positiveInt("priceMin", 0, 1_000_000);
  const priceMax = positiveInt("priceMax", 0, 1_000_000);
  const sortRaw = str("sort");
  const sort = MARKETPLACE_SORTS.includes(sortRaw as MarketplaceSort)
    ? (sortRaw as MarketplaceSort)
    : "recommended";

  return {
    q:              str("q"),
    categorySlug:   str("category"),
    city:           str("city"),
    district:       str("district"),
    minRating,
    hasMedia:       raw["hasMedia"] === "true",
    hasHours:       raw["hasHours"] === "true",
    availability,
    // Reject an inverted range — treat it as no price filter
    priceMin:       priceMin !== undefined && priceMax !== undefined && priceMin > priceMax ? undefined : priceMin,
    priceMax:       priceMin !== undefined && priceMax !== undefined && priceMin > priceMax ? undefined : priceMax,
    maxDuration:    positiveInt("maxDuration", 1, 24 * 60),
    minReviewCount: positiveInt("minReviewCount", 1, 100_000),
    sort,
  };
}

/**
 * Translates an availability filter into a BusinessHour `some` sub-filter.
 * This is a discovery heuristic ("plausibly open"), not a real slot check —
 * real slot availability is computed per-business at booking time (see src/lib/slots.ts).
 */
function buildAvailabilityHoursFilter(
  availability: ParsedFilters["availability"]
): Prisma.BusinessHourWhereInput | undefined {
  switch (availability) {
    case "today": {
      const dateStr = nowInBusinessTimezone().toISOString().slice(0, 10);
      return { dayOfWeek: getDayOfWeek(dateStr), isOpen: true };
    }
    case "tomorrow": {
      const tomorrow = new Date(nowInBusinessTimezone());
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { dayOfWeek: getDayOfWeek(tomorrow.toISOString().slice(0, 10)), isOpen: true };
    }
    case "weekend":
      return { dayOfWeek: { in: ["SATURDAY", "SUNDAY"] }, isOpen: true };
    case "evening":
      // String comparison is safe for zero-padded "HH:MM" times
      return { isOpen: true, closeTime: { gt: "18:00" } };
    default:
      return undefined;
  }
}

/**
 * Returns marketplace businesses that are ACTIVE_MARKETPLACE + isMarketplaceVisible.
 * Optional filters: categorySlug, city (case-insensitive), district (case-insensitive).
 * Hard limit: 50 results. Ordered newest first.
 */
export async function getMarketplaceBusinesses(
  filters: BusinessFilters = {}
): Promise<MarketplaceBusiness[]> {
  const {
    categorySlug, city, district, q, minRating, hasMedia, hasHours,
    availability, priceMin, priceMax, maxDuration, minReviewCount,
    sort = "recommended", bounds, limit,
  } = filters;

  // Combine hours-related conditions into a single `hours.some` filter — the
  // availability heuristic already implies `isOpen: true`, so it subsumes `hasHours`.
  const availabilityHoursFilter = buildAvailabilityHoursFilter(availability);
  const hoursFilter: Prisma.BusinessHourWhereInput | undefined =
    availabilityHoursFilter ?? (hasHours ? { isOpen: true } : undefined);

  // Combine service-related conditions (price range, max duration) into a single
  // `services.some` filter so a business matches only if ONE service satisfies all of them.
  const hasPriceFilter = priceMin !== undefined || priceMax !== undefined;
  const serviceFilter: Prisma.BusinessServiceWhereInput | undefined =
    hasPriceFilter || maxDuration !== undefined
      ? {
          isActive: true,
          ...(hasPriceFilter && {
            price: {
              ...(priceMin !== undefined && { gte: priceMin }),
              ...(priceMax !== undefined && { lte: priceMax }),
            },
          }),
          ...(maxDuration !== undefined && { durationMinutes: { lte: maxDuration } }),
        }
      : undefined;

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
      ...(q && {
        OR: [
          { name:        { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { city:        { contains: q, mode: "insensitive" } },
          { district:    { contains: q, mode: "insensitive" } },
          { services:    { some: { name: { contains: q, mode: "insensitive" }, isActive: true } } },
          { categories:  { some: { category: { name: { contains: q, mode: "insensitive" } } } } },
        ],
      }),
      ...(bounds && {
        AND: [
          {
            latitude: { gte: bounds.south, lte: bounds.north },
          },
          bounds.west <= bounds.east
            ? { longitude: { gte: bounds.west, lte: bounds.east } }
            : {
                OR: [
                  { longitude: { gte: bounds.west } },
                  { longitude: { lte: bounds.east } },
                ],
              },
        ],
      }),
      ...(hasMedia && {
        media: {
          some: {
            status: "ACTIVE",
            type: { in: ["PORTFOLIO_IMAGE", "PORTFOLIO_VIDEO", "BEFORE_AFTER"] },
          },
        },
      }),
      ...(hoursFilter && {
        hours: { some: hoursFilter },
      }),
      // Matches businesses with at least one active service satisfying all of price/duration (consistent with `q`'s "some" semantics)
      ...(serviceFilter && {
        services: { some: serviceFilter },
      }),
      ...(minReviewCount !== undefined && {
        ratingStats: { rawReviewCount: { gte: minReviewCount } },
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
      latitude: true,
      longitude: true,
      status: true,
      isMarketplaceVisible: true,
      ownershipStatus: true,
      marketplaceJoinedAt: true,
      isEditoriallyRecommended: true,
      editorialRecommendationRank: true,
      instantConfirmation: true,
      inAppPayment: true,
      categories: {
        select: {
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      services: {
        where: { isActive: true },
        select: { name: true },
      },
      hours: {
        where: { isOpen: true },
        select: { dayOfWeek: true },
      },
      media: {
        where: {
          status: "ACTIVE",
          type: {
            in: [
              "COVER",
              "LOGO",
              "PORTFOLIO_IMAGE",
              "PORTFOLIO_VIDEO",
              "BEFORE_AFTER",
            ],
          },
        },
        orderBy: [{ sortOrder: "asc" }],
        select: {
          type: true,
          publicId: true,
          cropX: true,
          cropY: true,
          cropWidth: true,
          cropHeight: true,
        },
      },
      ratingStats: {
        select: {
          bayesianScore: true,
          rawReviewCount: true,
          recentReviewCount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const mapped = raw.map((b) => {
    const {
      ratingStats,
      media,
      services,
      hours,
      status,
      isMarketplaceVisible,
      ...rest
    } = b;
    const coverMedia = media.find((item) => item.type === "COVER");
    const logoMedia = media.find((item) => item.type === "LOGO");
    const coverImageUrl = optimizeBusinessCoverUrl(
      coverMedia,
      b.coverImageUrl,
    );
    const logoUrl = optimizeBusinessLogoUrl(logoMedia, b.logoUrl);
    const launchAt = parseMarketplaceLaunchAt(
      process.env.MARKETPLACE_PUBLIC_LAUNCH_AT,
    );

    return {
      ...rest,
      coverImageUrl,
      logoUrl,
      reviewCount: ratingStats?.rawReviewCount ?? 0,
      reviewAvg: ratingStats?.bayesianScore ?? null,
      recentReviewCount: ratingStats?.recentReviewCount ?? 0,
      activeServiceNames: services.map((service) => service.name),
      activeServiceCount: services.length,
      openHourCount: hours.length,
      activePortfolioCount: media.filter((item) =>
        ["PORTFOLIO_IMAGE", "PORTFOLIO_VIDEO", "BEFORE_AFTER"].includes(
          item.type,
        ),
      ).length,
      isNewToUrGlowUp: isNewToUrGlowUp(
        {
          ownershipStatus: b.ownershipStatus,
          marketplaceJoinedAt: b.marketplaceJoinedAt,
          status,
          isMarketplaceVisible,
        },
        launchAt,
      ),
    };
  });

  const ratingFiltered = minRating != null
    ? mapped.filter((b) => b.reviewAvg !== null && b.reviewAvg >= minRating)
    : mapped;
  const ranked = rankMarketplaceBusinesses(ratingFiltered, {
    sort,
    query: q,
  });

  return ranked.slice(0, Math.min(Math.max(limit ?? 50, 1), 250));
}

/**
 * Returns all categories ordered by sortOrder, with a count of active visible
 * businesses in each category.
 */
/**
 * Not cached at this layer — apps/web wraps this in `unstable_cache` (Next.js
 * App Router-specific, so it can't live here) because it's called on every
 * page render via the persistent header search, in addition to the many
 * page-level callers below.
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
/** Not cached at this layer — same rationale as getMarketplaceCategories above. */
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

export type HomePersonalization = {
  rebookBusinessIds: string[];
  preferredCategoryIds: string[];
};

/**
 * Returns the small amount of signed-in customer context needed by the home
 * discovery rows. Personal recommendations are only read when the customer
 * has explicitly granted personalization consent.
 */
export async function getHomePersonalization(
  userId: string,
): Promise<HomePersonalization> {
  const [appointments, preferences] = await Promise.all([
    db.appointment.findMany({
      where: {
        customerId: userId,
        status: "COMPLETED",
        business: ACTIVE_VISIBLE,
      },
      orderBy: [{ requestedDate: "desc" }, { requestedTime: "desc" }],
      select: { businessId: true },
      take: 50,
    }),
    db.userPreferences.findUnique({
      where: { userId },
      select: {
        personalizationConsentAt: true,
        preferredCategoryIds: true,
      },
    }),
  ]);

  const rebookBusinessIds = [...new Set(
    appointments.map((appointment) => appointment.businessId),
  )].slice(0, 12);

  const storedCategoryIds =
    preferences?.personalizationConsentAt &&
    Array.isArray(preferences.preferredCategoryIds)
      ? preferences.preferredCategoryIds
      : [];

  return {
    rebookBusinessIds,
    preferredCategoryIds: storedCategoryIds.filter(
      (categoryId): categoryId is string => typeof categoryId === "string",
    ),
  };
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

/**
 * Minimum number of active visible listings a category+location combo needs
 * to be considered substantial enough to index (avoids thin-content pages).
 * Combos below this threshold still render, but generateMetadata should set
 * `robots: { index: false }` on them.
 */
export const CATEGORY_LOCATION_INDEX_THRESHOLD = 3;

export type CategoryLocationCombo = {
  categorySlug: string;
  city: string;
  district: string | null;
  /** Count of active visible businesses matching this category+location combo */
  count: number;
};

/**
 * Builds every (category, city) and (category, city, district) combination
 * that has at least one active visible business, with a listing count for
 * each. Backs both combo query helpers below — computed in one pass since
 * both need the same underlying business→category→location join, which
 * Prisma can't express as a single groupBy across the junction table.
 */
async function getCategoryLocationCombos(): Promise<CategoryLocationCombo[]> {
  const businesses = await db.business.findMany({
    where: { ...ACTIVE_VISIBLE, city: { not: null } },
    select: {
      city: true,
      district: true,
      categories: { select: { category: { select: { slug: true } } } },
    },
  });

  const combos = new Map<string, CategoryLocationCombo>();

  for (const business of businesses) {
    if (!business.city) continue;

    for (const { category } of business.categories) {
      const cityKey = `${category.slug}::${business.city}`;
      const cityCombo = combos.get(cityKey) ?? {
        categorySlug: category.slug,
        city: business.city,
        district: null,
        count: 0,
      };
      cityCombo.count += 1;
      combos.set(cityKey, cityCombo);

      if (business.district) {
        const districtKey = `${category.slug}::${business.city}::${business.district}`;
        const districtCombo = combos.get(districtKey) ?? {
          categorySlug: category.slug,
          city: business.city,
          district: business.district,
          count: 0,
        };
        districtCombo.count += 1;
        combos.set(districtKey, districtCombo);
      }
    }
  }

  return [...combos.values()];
}

/**
 * Returns (category, city) combos with ≥1 active visible business —
 * the candidate set for /category/[slug]/[city] landing pages.
 */
export async function getMarketplaceCategoryCityCombos(): Promise<CategoryLocationCombo[]> {
  const combos = await getCategoryLocationCombos();
  return combos.filter((c) => c.district === null);
}

/**
 * Returns (category, city, district) combos with ≥1 active visible business —
 * the candidate set for /category/[slug]/[city]/[district] landing pages.
 */
export async function getMarketplaceCategoryDistrictCombos(): Promise<CategoryLocationCombo[]> {
  const combos = await getCategoryLocationCombos();
  return combos.filter((c) => c.district !== null);
}

/**
 * Returns slugs and last-modified timestamps for all active visible businesses.
 * Used exclusively by the sitemap — no row limit.
 */
export async function getAllMarketplaceBusinessSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  return db.business.findMany({
    where: ACTIVE_VISIBLE,
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
