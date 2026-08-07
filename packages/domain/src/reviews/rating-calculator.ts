import { db } from "@urglowup/db";

type ReviewInput = {
  rating: number;
  createdAt: Date;
  trustWeight: number;
};

type StatsResult = {
  rawAverage: number;
  rawReviewCount: number;
  weightedAverage: number;
  effectiveReviewCount: number;
  bayesianScore: number;
  recentReviewCount: number;
};

const CONFIDENCE_THRESHOLD = 20;
const DEFAULT_GLOBAL_AVG = 5.0;

function getTimeWeight(createdAt: Date): number {
  const daysSince = (Date.now() - createdAt.getTime()) / 86_400_000;
  if (daysSince <= 30) return 1.0;
  if (daysSince <= 180) return 0.75;
  if (daysSince <= 365) return 0.5;
  return 0.25;
}

function calculateStats(
  reviews: ReviewInput[],
  globalAvg: number,
  m = CONFIDENCE_THRESHOLD,
): StatsResult {
  const now = Date.now();
  let weightedSum = 0;
  let weightSum = 0;
  let recentCount = 0;
  let rawSum = 0;

  for (const r of reviews) {
    const tw = getTimeWeight(r.createdAt);
    const fw = tw * r.trustWeight;
    weightedSum += r.rating * fw;
    weightSum += fw;
    rawSum += r.rating;
    if ((now - r.createdAt.getTime()) / 86_400_000 <= 30) recentCount++;
  }

  const n = reviews.length;
  const rawAverage = rawSum / n;
  const weightedAverage = weightSum > 0 ? weightedSum / weightSum : rawAverage;
  const v = weightSum;
  const bayesianScore = (v / (v + m)) * weightedAverage + (m / (v + m)) * globalAvg;

  return {
    rawAverage,
    rawReviewCount: n,
    weightedAverage,
    effectiveReviewCount: v,
    bayesianScore,
    recentReviewCount: recentCount,
  };
}

export async function getGlobalAverage(): Promise<number> {
  const statsResult = await db.businessRatingStats.aggregate({
    where: { rawReviewCount: { gt: 0 } },
    _avg: { rawAverage: true },
  });
  if (statsResult._avg.rawAverage != null) return statsResult._avg.rawAverage;

  const reviewResult = await db.review.aggregate({
    where: { status: "APPROVED", source: "URGLOWUP" },
    _avg: { rating: true },
  });
  if (reviewResult._avg.rating != null) return reviewResult._avg.rating;

  return DEFAULT_GLOBAL_AVG;
}

export async function recalculateBusinessStats(
  businessId: string,
  globalAvg: number,
): Promise<void> {
  const reviews = await db.review.findMany({
    where: { businessId, status: "APPROVED", source: "URGLOWUP" },
    select: { rating: true, createdAt: true, trustWeight: true },
  });

  const now = new Date();

  if (reviews.length === 0) {
    await db.businessRatingStats.upsert({
      where: { businessId },
      create: {
        businessId,
        rawAverage: null,
        rawReviewCount: 0,
        weightedAverage: null,
        effectiveReviewCount: 0,
        bayesianScore: null,
        recentReviewCount: 0,
        lastCalculatedAt: now,
      },
      update: {
        rawAverage: null,
        rawReviewCount: 0,
        weightedAverage: null,
        effectiveReviewCount: 0,
        bayesianScore: null,
        recentReviewCount: 0,
        lastCalculatedAt: now,
      },
    });
    return;
  }

  const stats = calculateStats(reviews, globalAvg);

  await db.businessRatingStats.upsert({
    where: { businessId },
    create: { businessId, ...stats, lastCalculatedAt: now },
    update: { ...stats, lastCalculatedAt: now },
  });
}

export async function recalculateAllStats(): Promise<{
  processed: number;
  globalAverage: number;
}> {
  const globalAvg = await getGlobalAverage();

  const businesses = await db.business.findMany({
    where: {
      reviews: { some: { status: "APPROVED", source: "URGLOWUP" } },
    },
    select: { id: true },
  });

  for (const biz of businesses) {
    await recalculateBusinessStats(biz.id, globalAvg);
  }

  return { processed: businesses.length, globalAverage: globalAvg };
}
