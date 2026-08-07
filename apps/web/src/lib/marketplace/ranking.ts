export const NEW_TO_MARKETPLACE_DAYS = 30;
export const ORGANIC_RECOMMENDATION_MIN_REVIEWS = 5;
export const ORGANIC_RECOMMENDATION_MIN_SCORE = 8;
export const POPULAR_MIN_REVIEWS = 3;

export const MARKETPLACE_SORTS = [
  "recommended",
  "rating",
  "reviewCount",
  "newest",
] as const;

export type MarketplaceSort = (typeof MARKETPLACE_SORTS)[number];

export type DiscoveryBusiness = {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  categories: Array<{
    category: { id: string; name: string; slug: string };
  }>;
  ownershipStatus: "UNCLAIMED" | "CLAIM_PENDING" | "CLAIMED";
  marketplaceJoinedAt: Date | null;
  isEditoriallyRecommended: boolean;
  editorialRecommendationRank: number | null;
  instantConfirmation: boolean;
  inAppPayment: boolean;
  reviewCount: number;
  reviewAvg: number | null;
  recentReviewCount: number;
  activeServiceNames: string[];
  activeServiceCount: number;
  openHourCount: number;
  activePortfolioCount: number;
  isNewToUrGlowUp: boolean;
};

const DAY_MS = 86_400_000;

export function parseMarketplaceLaunchAt(
  value: string | undefined,
): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function isNewToUrGlowUp(
  business: Pick<
    DiscoveryBusiness,
    "ownershipStatus" | "marketplaceJoinedAt"
  > & {
    status: string;
    isMarketplaceVisible: boolean;
  },
  launchAt: Date | null,
  now = new Date(),
): boolean {
  if (
    business.ownershipStatus !== "CLAIMED" ||
    business.status !== "ACTIVE_MARKETPLACE" ||
    !business.isMarketplaceVisible ||
    !business.marketplaceJoinedAt ||
    !launchAt
  ) {
    return false;
  }

  const joinedAt = business.marketplaceJoinedAt.getTime();
  const age = now.getTime() - joinedAt;

  return (
    joinedAt >= launchAt.getTime() &&
    age >= 0 &&
    age <= NEW_TO_MARKETPLACE_DAYS * DAY_MS
  );
}

export function getRecommendationReadinessIssues(
  business: Pick<
    DiscoveryBusiness,
    | "ownershipStatus"
    | "coverImageUrl"
    | "categories"
    | "city"
    | "district"
    | "activeServiceCount"
    | "openHourCount"
  >,
): string[] {
  const issues: string[] = [];

  if (business.ownershipStatus !== "CLAIMED") {
    issues.push("İşletme sahiplenilmiş olmalı.");
  }
  if (!business.coverImageUrl) {
    issues.push("Kapak görseli eklenmeli.");
  }
  if (business.categories.length === 0) {
    issues.push("En az bir kategori seçilmeli.");
  }
  if (!business.city && !business.district) {
    issues.push("Konum bilgisi eklenmeli.");
  }
  if (business.activeServiceCount === 0) {
    issues.push("En az bir aktif hizmet eklenmeli.");
  }
  if (business.openHourCount === 0) {
    issues.push("En az bir açık çalışma günü eklenmeli.");
  }

  return issues;
}

export function isRecommendationReady(
  business: Parameters<typeof getRecommendationReadinessIssues>[0],
): boolean {
  return getRecommendationReadinessIssues(business).length === 0;
}

export function calculateRecommendationScore(
  business: DiscoveryBusiness,
  preferredCategoryIds: ReadonlySet<string> = new Set(),
): number {
  if (business.ownershipStatus !== "CLAIMED") return 0;

  const ratingScore = (business.reviewAvg ?? 0) * 5;
  const reviewConfidence =
    Math.min(
      Math.log1p(business.reviewCount) / Math.log1p(50),
      1,
    ) * 20;
  const reviewRecency =
    Math.min(business.recentReviewCount / 5, 1) * 10;
  const bookingReadiness =
    (business.instantConfirmation ? 6 : 0) +
    (business.inAppPayment ? 2 : 0) +
    (business.openHourCount > 0 ? 2 : 0);
  const profileCompleteness =
    (business.coverImageUrl ? 3 : 0) +
    (business.logoUrl ? 2 : 0) +
    (business.description?.trim() ? 2 : 0) +
    (business.city || business.district ? 1 : 0) +
    (business.activePortfolioCount >= 3 ? 2 : 0);
  const preferenceBoost = business.categories.some(({ category }) =>
    preferredCategoryIds.has(category.id),
  )
    ? 15
    : 0;

  return (
    ratingScore +
    reviewConfidence +
    reviewRecency +
    bookingReadiness +
    profileCompleteness +
    preferenceBoost
  );
}

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");
}

export function getSearchMatchTier(
  business: Pick<
    DiscoveryBusiness,
    "name" | "activeServiceNames" | "categories"
  >,
  query: string | undefined,
): number {
  const normalizedQuery = normalizeSearchValue(query ?? "");
  if (!normalizedQuery) return 0;

  const name = normalizeSearchValue(business.name);
  if (name === normalizedQuery) return 4;
  if (name.startsWith(normalizedQuery)) return 3;
  if (name.includes(normalizedQuery)) return 2;

  const matchesServiceOrCategory =
    business.activeServiceNames.some((serviceName) =>
      normalizeSearchValue(serviceName).includes(normalizedQuery),
    ) ||
    business.categories.some(({ category }) =>
      normalizeSearchValue(category.name).includes(normalizedQuery),
    );

  return matchesServiceOrCategory ? 1 : 0;
}

function byStableName(
  first: DiscoveryBusiness,
  second: DiscoveryBusiness,
): number {
  return first.name.localeCompare(second.name, "tr");
}

function capNewBusinessesInFirstPage<T extends DiscoveryBusiness>(
  businesses: T[],
  firstPageSize = 12,
  maxNewBusinesses = 2,
): T[] {
  const firstPage: T[] = [];
  const deferredNew: T[] = [];
  const tail: T[] = [];
  let newCount = 0;

  for (const business of businesses) {
    if (firstPage.length < firstPageSize) {
      if (business.isNewToUrGlowUp && newCount >= maxNewBusinesses) {
        deferredNew.push(business);
        continue;
      }
      firstPage.push(business);
      if (business.isNewToUrGlowUp) newCount += 1;
      continue;
    }
    tail.push(business);
  }

  return [...firstPage, ...deferredNew, ...tail];
}

export function rankMarketplaceBusinesses<T extends DiscoveryBusiness>(
  businesses: T[],
  options: {
    sort: MarketplaceSort;
    query?: string;
    preferredCategoryIds?: ReadonlySet<string>;
  },
): T[] {
  const preferredCategoryIds = options.preferredCategoryIds ?? new Set<string>();

  const ranked = [...businesses].sort((first, second) => {
    const searchDifference =
      getSearchMatchTier(second, options.query) -
      getSearchMatchTier(first, options.query);
    if (searchDifference !== 0) return searchDifference;

    if (options.sort === "rating") {
      return (
        (second.reviewAvg ?? -1) - (first.reviewAvg ?? -1) ||
        second.reviewCount - first.reviewCount ||
        byStableName(first, second)
      );
    }

    if (options.sort === "reviewCount") {
      return (
        second.reviewCount - first.reviewCount ||
        (second.reviewAvg ?? -1) - (first.reviewAvg ?? -1) ||
        second.recentReviewCount - first.recentReviewCount ||
        byStableName(first, second)
      );
    }

    if (options.sort === "newest") {
      return (
        (second.marketplaceJoinedAt?.getTime() ?? 0) -
          (first.marketplaceJoinedAt?.getTime() ?? 0) ||
        calculateRecommendationScore(second, preferredCategoryIds) -
          calculateRecommendationScore(first, preferredCategoryIds) ||
        byStableName(first, second)
      );
    }

    const firstScore =
      calculateRecommendationScore(first, preferredCategoryIds) +
      (first.isNewToUrGlowUp ? 5 : 0);
    const secondScore =
      calculateRecommendationScore(second, preferredCategoryIds) +
      (second.isNewToUrGlowUp ? 5 : 0);

    return (
      secondScore - firstScore ||
      second.reviewCount - first.reviewCount ||
      byStableName(first, second)
    );
  });

  return options.sort === "recommended"
    ? capNewBusinessesInFirstPage(ranked)
    : ranked;
}

export function selectRecommendedBusinesses<T extends DiscoveryBusiness>(
  businesses: T[],
  preferredCategoryIds: ReadonlySet<string>,
  limit = 12,
): T[] {
  const organic = businesses
    .filter(
      (business) =>
        isRecommendationReady(business) &&
        business.reviewCount >= ORGANIC_RECOMMENDATION_MIN_REVIEWS &&
        (business.reviewAvg ?? 0) >= ORGANIC_RECOMMENDATION_MIN_SCORE,
    )
    .sort(
      (first, second) =>
        calculateRecommendationScore(second, preferredCategoryIds) -
          calculateRecommendationScore(first, preferredCategoryIds) ||
        second.reviewCount - first.reviewCount ||
        byStableName(first, second),
    );

  const selectedIds = new Set(organic.map((business) => business.id));
  const editorial = businesses
    .filter(
      (business) =>
        !selectedIds.has(business.id) &&
        business.isEditoriallyRecommended &&
        isRecommendationReady(business),
    )
    .sort(
      (first, second) =>
        (first.editorialRecommendationRank ?? Number.MAX_SAFE_INTEGER) -
          (second.editorialRecommendationRank ?? Number.MAX_SAFE_INTEGER) ||
        byStableName(first, second),
    );

  return [...organic, ...editorial].slice(0, limit);
}

export function selectPopularBusinesses<T extends DiscoveryBusiness>(
  businesses: T[],
  limit = 12,
): T[] {
  return businesses
    .filter(
      (business) =>
        business.ownershipStatus === "CLAIMED" &&
        business.reviewCount >= POPULAR_MIN_REVIEWS,
    )
    .sort(
      (first, second) =>
        second.reviewCount - first.reviewCount ||
        (second.reviewAvg ?? -1) - (first.reviewAvg ?? -1) ||
        second.recentReviewCount - first.recentReviewCount ||
        byStableName(first, second),
    )
    .slice(0, limit);
}

export function selectNewBusinesses<T extends DiscoveryBusiness>(
  businesses: T[],
  limit = 12,
): T[] {
  return businesses
    .filter(
      (business) =>
        business.isNewToUrGlowUp && isRecommendationReady(business),
    )
    .sort(
      (first, second) =>
        (second.marketplaceJoinedAt?.getTime() ?? 0) -
          (first.marketplaceJoinedAt?.getTime() ?? 0) ||
        byStableName(first, second),
    )
    .slice(0, limit);
}
