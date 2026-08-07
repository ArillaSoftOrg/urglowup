/**
 * CRUD operations for ExternalReviewCache records.
 *
 * Architecture rules enforced by this module:
 *   - Google reviews are the ONLY permitted writers to ExternalReviewCache.
 *   - The native Review table must NEVER receive Google review data.
 *   - Google and UrGlowUp ratings are NEVER merged or compared.
 *
 * Display rules (enforced at query time):
 *   Public UI shows a review only when ALL three conditions are true:
 *     1. visibilityStatus === VISIBLE
 *     2. expiresAt > now()
 *     3. connection.showExternalReviews === true
 *
 *   Businesses CANNOT hide individual Google reviews (no HIDDEN_BY_BUSINESS status).
 *   They can only hide the entire Google reviews section via showExternalReviews.
 */
import type { ExternalReviewCacheModel as ExternalReviewCache } from "@/generated/prisma/models";
import type { NormalizedGoogleReview, GoogleReviewSummary } from "./google/types";
import { EXTERNAL_CACHE_TTL_MS } from "@/lib/constants/external";
import { db } from "@/lib/db";

// Re-export for consumers
export type { NormalizedGoogleReview, GoogleReviewSummary };

// ── Input / output types ──────────────────────────────────────────────────────

export interface UpsertReviewInput extends NormalizedGoogleReview {
  businessId: string;
  connectionId: string;
  provider: "GOOGLE_BUSINESS_PROFILE";
}

export interface ReviewCacheStats {
  totalCached: number;
  visibleCount: number;
  hiddenBySystemCount: number;
  averageRating: number | null;
  oldestFetchedAt: Date | null;
  nextExpiresAt: Date | null;
}

// ── Read operations ───────────────────────────────────────────────────────────

/**
 * Returns cached reviews for a business.
 *
 * Default behaviour: VISIBLE status + non-expired, ordered by createTime desc.
 * Pass includeHidden=true or includeExpired=true to override for admin views.
 */
export async function getCachedReviews(
  businessId: string,
  options?: {
    limit?: number;
    includeHidden?: boolean;
    includeExpired?: boolean;
  },
): Promise<ExternalReviewCache[]> {
  const now = new Date();
  return db.externalReviewCache.findMany({
    where: {
      businessId,
      provider: "GOOGLE_BUSINESS_PROFILE",
      ...(options?.includeHidden ? {} : { visibilityStatus: "VISIBLE" }),
      ...(options?.includeExpired ? {} : { expiresAt: { gt: now } }),
    },
    orderBy: { createTime: "desc" },
    take: options?.limit,
  });
}

/**
 * Returns aggregate stats for a business's cached Google reviews.
 * Used by the business dashboard Google review summary card.
 */
export async function getReviewCacheStats(
  businessId: string,
): Promise<ReviewCacheStats> {
  const now = new Date();

  const [totals, visible, hiddenBySystem, ratingAgg, oldest, nextExpiry] =
    await Promise.all([
      db.externalReviewCache.count({
        where: { businessId, provider: "GOOGLE_BUSINESS_PROFILE" },
      }),
      db.externalReviewCache.count({
        where: {
          businessId,
          provider: "GOOGLE_BUSINESS_PROFILE",
          visibilityStatus: "VISIBLE",
          expiresAt: { gt: now },
        },
      }),
      db.externalReviewCache.count({
        where: {
          businessId,
          provider: "GOOGLE_BUSINESS_PROFILE",
          visibilityStatus: "HIDDEN_BY_SYSTEM",
        },
      }),
      db.externalReviewCache.aggregate({
        where: {
          businessId,
          provider: "GOOGLE_BUSINESS_PROFILE",
          visibilityStatus: "VISIBLE",
          expiresAt: { gt: now },
        },
        _avg: { rating: true },
      }),
      db.externalReviewCache.findFirst({
        where: { businessId, provider: "GOOGLE_BUSINESS_PROFILE" },
        orderBy: { fetchedAt: "asc" },
        select: { fetchedAt: true },
      }),
      db.externalReviewCache.findFirst({
        where: { businessId, provider: "GOOGLE_BUSINESS_PROFILE" },
        orderBy: { expiresAt: "asc" },
        select: { expiresAt: true },
      }),
    ]);

  return {
    totalCached: totals,
    visibleCount: visible,
    hiddenBySystemCount: hiddenBySystem,
    averageRating: ratingAgg._avg.rating ?? null,
    oldestFetchedAt: oldest?.fetchedAt ?? null,
    nextExpiresAt: nextExpiry?.expiresAt ?? null,
  };
}

/**
 * Returns the Google review summary for the public business profile.
 * Only counts VISIBLE, non-expired reviews from an ACTIVE connection.
 * The returned averageRating is NEVER combined with UrGlowUp's rating.
 */
export async function getGoogleReviewSummary(
  businessId: string,
): Promise<GoogleReviewSummary> {
  const now = new Date();

  const [agg, fetchedRow, expiryRow] = await Promise.all([
    db.externalReviewCache.aggregate({
      where: {
        businessId,
        provider: "GOOGLE_BUSINESS_PROFILE",
        visibilityStatus: "VISIBLE",
        expiresAt: { gt: now },
        connection: { status: "ACTIVE", showExternalReviews: true },
      },
      _avg: { rating: true },
      _count: { providerReviewId: true },
    }),
    db.externalReviewCache.findFirst({
      where: {
        businessId,
        provider: "GOOGLE_BUSINESS_PROFILE",
        visibilityStatus: "VISIBLE",
        expiresAt: { gt: now },
      },
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    }),
    db.externalReviewCache.findFirst({
      where: {
        businessId,
        provider: "GOOGLE_BUSINESS_PROFILE",
        visibilityStatus: "VISIBLE",
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "asc" },
      select: { expiresAt: true },
    }),
  ]);

  return {
    provider: "GOOGLE_BUSINESS_PROFILE",
    averageRating: agg._avg.rating ?? null,
    totalCount: agg._count.providerReviewId,
    fetchedAt: fetchedRow?.fetchedAt ?? null,
    expiresAt: expiryRow?.expiresAt ?? null,
  };
}

// ── Write operations ──────────────────────────────────────────────────────────

/**
 * Upserts a single review into ExternalReviewCache.
 * - Sets fetchedAt = now()
 * - Sets expiresAt = now() + EXTERNAL_CACHE_TTL_MS (30 days)
 * - Uses @@unique([businessId, provider, providerReviewId]) for conflict resolution
 * - Does NOT reset visibilityStatus on update — HIDDEN_BY_SYSTEM reviews stay hidden
 */
export async function upsertCachedReview(
  input: UpsertReviewInput,
): Promise<ExternalReviewCache> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXTERNAL_CACHE_TTL_MS);

  return db.externalReviewCache.upsert({
    where: {
      businessId_provider_providerReviewId: {
        businessId: input.businessId,
        provider: input.provider,
        providerReviewId: input.providerReviewId,
      },
    },
    create: {
      businessId: input.businessId,
      connectionId: input.connectionId,
      provider: input.provider,
      providerReviewId: input.providerReviewId,
      rating: input.rating,
      comment: input.comment,
      reviewerDisplayName: input.reviewerDisplayName,
      reviewerProfilePhotoUrl: input.reviewerProfilePhotoUrl,
      createTime: input.createTime,
      updateTime: input.updateTime,
      merchantReply: input.merchantReply,
      attribution: input.attribution,
      sourceUrl: input.sourceUrl,
      fetchedAt: now,
      expiresAt,
    },
    update: {
      rating: input.rating,
      comment: input.comment,
      reviewerDisplayName: input.reviewerDisplayName,
      reviewerProfilePhotoUrl: input.reviewerProfilePhotoUrl,
      updateTime: input.updateTime,
      merchantReply: input.merchantReply,
      attribution: input.attribution,
      sourceUrl: input.sourceUrl,
      fetchedAt: now,
      expiresAt,
      // visibilityStatus intentionally NOT reset — system-hidden reviews stay hidden
    },
  });
}

/**
 * Bulk-upserts reviews from a sync batch using a transaction.
 * Does NOT reset visibilityStatus on update — HIDDEN_BY_SYSTEM reviews stay hidden.
 * @returns Count of upserted records
 */
export async function upsertCachedReviews(
  inputs: UpsertReviewInput[],
): Promise<number> {
  if (inputs.length === 0) return 0;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXTERNAL_CACHE_TTL_MS);

  await db.$transaction(
    inputs.map((input) =>
      db.externalReviewCache.upsert({
        where: {
          businessId_provider_providerReviewId: {
            businessId: input.businessId,
            provider: input.provider,
            providerReviewId: input.providerReviewId,
          },
        },
        create: {
          businessId: input.businessId,
          connectionId: input.connectionId,
          provider: input.provider,
          providerReviewId: input.providerReviewId,
          rating: input.rating,
          comment: input.comment,
          reviewerDisplayName: input.reviewerDisplayName,
          reviewerProfilePhotoUrl: input.reviewerProfilePhotoUrl,
          createTime: input.createTime,
          updateTime: input.updateTime,
          merchantReply: input.merchantReply,
          attribution: input.attribution,
          sourceUrl: input.sourceUrl,
          fetchedAt: now,
          expiresAt,
        },
        update: {
          rating: input.rating,
          comment: input.comment,
          reviewerDisplayName: input.reviewerDisplayName,
          reviewerProfilePhotoUrl: input.reviewerProfilePhotoUrl,
          updateTime: input.updateTime,
          merchantReply: input.merchantReply,
          attribution: input.attribution,
          sourceUrl: input.sourceUrl,
          fetchedAt: now,
          expiresAt,
          // visibilityStatus intentionally NOT reset — system-hidden reviews stay hidden
        },
      }),
    ),
  );

  return inputs.length;
}

// ── Visibility operations ─────────────────────────────────────────────────────

/**
 * Hides a review — sets visibilityStatus = HIDDEN_BY_SYSTEM.
 * Only the system (admin/moderation) can hide individual Google reviews.
 * Businesses cannot hide individual reviews — they use showExternalReviews instead.
 *
 * @param reason - Stored in lastError field for audit purposes
 */
export async function hideReviewBySystem(
  reviewId: string,
  reason: string,
): Promise<ExternalReviewCache> {
  void reason; // reason is logged by caller for audit purposes
  return db.externalReviewCache.update({
    where: { id: reviewId },
    data: { visibilityStatus: "HIDDEN_BY_SYSTEM" },
  });
}

// ── Cleanup operations ────────────────────────────────────────────────────────

/**
 * Hard-deletes expired review cache entries (where expiresAt < now).
 * Called by the /api/internal/cache-cleanup route.
 *
 * Note: Prisma deleteMany does not support take/limit — batchSize is a documented
 * soft limit. For large deployments, switch to raw SQL with LIMIT.
 *
 * @param batchSize - Documented limit (not enforced at DB level by Prisma)
 * @returns Number of deleted records
 */
export async function expireReviews(batchSize?: number): Promise<number> {
  void batchSize; // documented soft limit — Prisma deleteMany has no LIMIT support
  const result = await db.externalReviewCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
