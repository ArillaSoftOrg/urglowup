import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRecommendationScore,
  getSearchMatchTier,
  isNewToUrGlowUp,
  rankMarketplaceBusinesses,
  selectPopularBusinesses,
  selectRecommendedBusinesses,
  type DiscoveryBusiness,
} from "./ranking";

function business(
  overrides: Partial<DiscoveryBusiness> & Pick<DiscoveryBusiness, "id">,
): DiscoveryBusiness {
  const { id, ...rest } = overrides;

  return {
    id,
    name: `İşletme ${id}`,
    description: "Eksiksiz işletme profili",
    coverImageUrl: "/cover.jpg",
    logoUrl: "/logo.jpg",
    city: "İstanbul",
    district: "Kadıköy",
    categories: [
      {
        category: {
          id: "hair",
          name: "Kuaför",
          slug: "hair-salon",
        },
      },
    ],
    ownershipStatus: "CLAIMED",
    marketplaceJoinedAt: null,
    isEditoriallyRecommended: false,
    editorialRecommendationRank: null,
    instantConfirmation: true,
    inAppPayment: true,
    reviewCount: 5,
    reviewAvg: 8,
    recentReviewCount: 2,
    activeServiceNames: ["Saç kesimi"],
    activeServiceCount: 1,
    openHourCount: 5,
    activePortfolioCount: 3,
    isNewToUrGlowUp: false,
    ...rest,
  };
}

test("new status requires launch, ownership and a 30-day window", () => {
  const launchAt = new Date("2026-09-01T00:00:00.000Z");
  const now = new Date("2026-09-30T00:00:00.000Z");
  const joined = {
    ownershipStatus: "CLAIMED" as const,
    marketplaceJoinedAt: new Date("2026-09-01T00:00:00.000Z"),
    status: "ACTIVE_MARKETPLACE",
    isMarketplaceVisible: true,
  };

  assert.equal(isNewToUrGlowUp(joined, null, now), false);
  assert.equal(isNewToUrGlowUp(joined, launchAt, now), true);
  assert.equal(
    isNewToUrGlowUp(
      { ...joined, isMarketplaceVisible: false },
      launchAt,
      now,
    ),
    false,
  );
  assert.equal(
    isNewToUrGlowUp(
      { ...joined, ownershipStatus: "UNCLAIMED" },
      launchAt,
      now,
    ),
    false,
  );
  assert.equal(
    isNewToUrGlowUp(
      {
        ...joined,
        marketplaceJoinedAt: new Date("2026-08-31T23:59:59.000Z"),
      },
      launchAt,
      now,
    ),
    false,
  );
  assert.equal(
    isNewToUrGlowUp(joined, launchAt, new Date("2026-10-02T00:00:00.000Z")),
    false,
  );
});

test("recommendation score rewards trust, recency and booking readiness", () => {
  const strong = business({ id: "strong", reviewCount: 30, reviewAvg: 9 });
  const weak = business({
    id: "weak",
    reviewCount: 1,
    reviewAvg: 6,
    recentReviewCount: 0,
    instantConfirmation: false,
    inAppPayment: false,
    logoUrl: null,
    activePortfolioCount: 0,
  });

  assert.ok(
    calculateRecommendationScore(strong) >
      calculateRecommendationScore(weak),
  );
});

test("organic recommendations lead and editorial fallback follows rank", () => {
  const organic = business({ id: "organic", reviewCount: 8, reviewAvg: 9 });
  const editorialSecond = business({
    id: "editorial-2",
    reviewCount: 0,
    reviewAvg: null,
    isEditoriallyRecommended: true,
    editorialRecommendationRank: 2,
  });
  const editorialFirst = business({
    id: "editorial-1",
    reviewCount: 0,
    reviewAvg: null,
    isEditoriallyRecommended: true,
    editorialRecommendationRank: 1,
  });
  const belowThreshold = business({
    id: "below",
    reviewCount: 4,
    reviewAvg: 9,
  });

  assert.deepEqual(
    selectRecommendedBusinesses(
      [editorialSecond, belowThreshold, editorialFirst, organic],
      new Set(),
    ).map(({ id }) => id),
    ["organic", "editorial-1", "editorial-2"],
  );
});

test("popular businesses require ownership and three native reviews", () => {
  const mostReviewed = business({ id: "popular", reviewCount: 20 });
  const tooFew = business({ id: "few", reviewCount: 2, reviewAvg: 10 });
  const unclaimed = business({
    id: "unclaimed",
    ownershipStatus: "UNCLAIMED",
    reviewCount: 100,
  });

  assert.deepEqual(
    selectPopularBusinesses([tooFew, unclaimed, mostReviewed]).map(
      ({ id }) => id,
    ),
    ["popular"],
  );
});

test("recommended results cap boosted new businesses at two in the first 12", () => {
  const candidates = Array.from({ length: 16 }, (_, index) =>
    business({
      id: String(index),
      name: `${String(index).padStart(2, "0")} İşletme`,
      reviewCount: 10,
      reviewAvg: 9,
      isNewToUrGlowUp: index < 5,
    }),
  );

  const ranked = rankMarketplaceBusinesses(candidates, {
    sort: "recommended",
  });

  assert.equal(
    ranked.slice(0, 12).filter(({ isNewToUrGlowUp }) => isNewToUrGlowUp)
      .length,
    2,
  );
});

test("free-text ordering prefers exact name before service matches", () => {
  const exact = business({ id: "exact", name: "Lale" });
  const prefix = business({ id: "prefix", name: "Lale Güzellik" });
  const service = business({
    id: "service",
    name: "Başka İşletme",
    activeServiceNames: ["Lale bakımı"],
  });

  assert.equal(getSearchMatchTier(exact, "Lale"), 4);
  assert.equal(getSearchMatchTier(prefix, "Lale"), 3);
  assert.equal(getSearchMatchTier(service, "Lale"), 1);
});
