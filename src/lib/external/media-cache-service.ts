/**
 * CRUD operations for ExternalMediaCache records.
 *
 * Architecture rules enforced by this module:
 *   - Google photos are NEVER uploaded to Cloudinary.
 *   - Google photos are NEVER written to BusinessMedia.
 *   - sourceUrl must always be a Google CDN URL — validated before every write.
 *   - Even isFeaturedByBusiness=true photos remain labeled as Google-sourced in UI.
 *   - isFeaturedByBusiness promotes display priority, NOT ownership transfer.
 */
import type { ExternalMediaCacheModel as ExternalMediaCache } from "@/generated/prisma/models";
import type { NormalizedGooglePhoto } from "./google/types";
import { assertGoogleCdnUrl, assertNotCloudinaryUrl } from "./google/policy";
import { EXTERNAL_CACHE_TTL_MS } from "@/lib/constants/external";
import { db } from "@/lib/db";

// Re-export for consumers
export type { NormalizedGooglePhoto };

// ── Input / output types ──────────────────────────────────────────────────────

export interface UpsertPhotoInput extends NormalizedGooglePhoto {
  businessId: string;
  connectionId: string;
  provider: "GOOGLE_BUSINESS_PROFILE";
}

// ── Read operations ───────────────────────────────────────────────────────────

/**
 * Returns cached photos for a business.
 *
 * Default behaviour: VISIBLE status + non-expired, ordered by displayOrder asc then fetchedAt desc.
 * Pass includeHidden=true to include HIDDEN_BY_BUSINESS and HIDDEN_BY_SYSTEM photos.
 */
export async function getCachedPhotos(
  businessId: string,
  options?: {
    limit?: number;
    includeHidden?: boolean;
    includeExpired?: boolean;
  },
): Promise<ExternalMediaCache[]> {
  const now = new Date();
  return db.externalMediaCache.findMany({
    where: {
      businessId,
      provider: "GOOGLE_BUSINESS_PROFILE",
      ...(options?.includeHidden ? {} : { visibilityStatus: "VISIBLE" }),
      ...(options?.includeExpired ? {} : { expiresAt: { gt: now } }),
    },
    orderBy: [{ displayOrder: "asc" }, { fetchedAt: "desc" }],
    take: options?.limit,
  });
}

/**
 * Returns photos marked as isFeaturedByBusiness, VISIBLE, and non-expired.
 * Featured photos may be displayed more prominently but remain Google-attributed.
 */
export async function getFeaturedPhotos(
  businessId: string,
  limit?: number,
): Promise<ExternalMediaCache[]> {
  return db.externalMediaCache.findMany({
    where: {
      businessId,
      provider: "GOOGLE_BUSINESS_PROFILE",
      isFeaturedByBusiness: true,
      visibilityStatus: "VISIBLE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { displayOrder: "asc" },
    take: limit,
  });
}

// ── Write operations ──────────────────────────────────────────────────────────

/**
 * Validates that sourceUrl is a Google CDN URL, then upserts the photo into cache.
 *
 * Policy guards are called BEFORE any database operation — if validation fails,
 * the DB is never touched.
 *
 * - Sets fetchedAt = now()
 * - Sets expiresAt = now() + EXTERNAL_CACHE_TTL_MS (30 days)
 * - Uses @@unique([businessId, provider, providerMediaId]) for conflict resolution
 * - Does NOT reset visibilityStatus, isFeaturedByBusiness, or displayOrder on update
 */
export async function upsertCachedPhoto(
  input: UpsertPhotoInput,
): Promise<ExternalMediaCache> {
  // Policy guards — always run before touching the DB
  assertNotCloudinaryUrl(
    input.sourceUrl,
    `upsertCachedPhoto(providerMediaId=${input.providerMediaId})`,
  );
  assertGoogleCdnUrl(
    input.sourceUrl,
    `upsertCachedPhoto(providerMediaId=${input.providerMediaId})`,
  );

  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXTERNAL_CACHE_TTL_MS);

  return db.externalMediaCache.upsert({
    where: {
      businessId_provider_providerMediaId: {
        businessId: input.businessId,
        provider: input.provider,
        providerMediaId: input.providerMediaId,
      },
    },
    create: {
      businessId: input.businessId,
      connectionId: input.connectionId,
      provider: input.provider,
      providerMediaId: input.providerMediaId,
      mediaFormat: input.mediaFormat,
      category: input.category,
      sourceUrl: input.sourceUrl,
      thumbnailUrl: input.thumbnailUrl,
      attribution: input.attribution,
      createTime: input.createTime,
      fetchedAt: now,
      expiresAt,
    },
    update: {
      mediaFormat: input.mediaFormat,
      category: input.category,
      sourceUrl: input.sourceUrl,
      thumbnailUrl: input.thumbnailUrl,
      attribution: input.attribution,
      createTime: input.createTime,
      fetchedAt: now,
      expiresAt,
      // visibilityStatus intentionally NOT reset — business/system curation preserved
      // isFeaturedByBusiness intentionally NOT reset — business preference preserved
      // displayOrder intentionally NOT reset — business ordering preserved
    },
  });
}

/**
 * Bulk-upserts photos from a sync batch.
 * Validates ALL URLs before opening the transaction — any policy violation aborts the entire batch.
 * Does NOT reset visibilityStatus, isFeaturedByBusiness, or displayOrder on update.
 *
 * @returns Count of upserted records
 */
export async function upsertCachedPhotos(
  inputs: UpsertPhotoInput[],
): Promise<number> {
  if (inputs.length === 0) return 0;

  // Validate all URLs before touching the DB
  for (const input of inputs) {
    assertNotCloudinaryUrl(
      input.sourceUrl,
      `bulk upsert — providerMediaId=${input.providerMediaId}`,
    );
    assertGoogleCdnUrl(
      input.sourceUrl,
      `bulk upsert — providerMediaId=${input.providerMediaId}`,
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXTERNAL_CACHE_TTL_MS);

  await db.$transaction(
    inputs.map((input) =>
      db.externalMediaCache.upsert({
        where: {
          businessId_provider_providerMediaId: {
            businessId: input.businessId,
            provider: input.provider,
            providerMediaId: input.providerMediaId,
          },
        },
        create: {
          businessId: input.businessId,
          connectionId: input.connectionId,
          provider: input.provider,
          providerMediaId: input.providerMediaId,
          mediaFormat: input.mediaFormat,
          category: input.category,
          sourceUrl: input.sourceUrl,
          thumbnailUrl: input.thumbnailUrl,
          attribution: input.attribution,
          createTime: input.createTime,
          fetchedAt: now,
          expiresAt,
        },
        update: {
          mediaFormat: input.mediaFormat,
          category: input.category,
          sourceUrl: input.sourceUrl,
          thumbnailUrl: input.thumbnailUrl,
          attribution: input.attribution,
          createTime: input.createTime,
          fetchedAt: now,
          expiresAt,
          // visibilityStatus intentionally NOT reset — business/system curation preserved
          // isFeaturedByBusiness intentionally NOT reset — business preference preserved
          // displayOrder intentionally NOT reset — business ordering preserved
        },
      }),
    ),
  );

  return inputs.length;
}

// ── Visibility operations ─────────────────────────────────────────────────────

/**
 * Hides a photo — sets visibilityStatus = HIDDEN_BY_BUSINESS.
 * Businesses may curate which Google photos appear on their profile.
 */
export async function hidePhotoByBusiness(
  photoId: string,
): Promise<ExternalMediaCache> {
  return db.externalMediaCache.update({
    where: { id: photoId },
    data: { visibilityStatus: "HIDDEN_BY_BUSINESS" },
  });
}

/**
 * Restores a previously hidden photo to VISIBLE.
 * Only applies to HIDDEN_BY_BUSINESS — system-hidden photos require admin action.
 */
export async function restorePhotoByBusiness(
  photoId: string,
): Promise<ExternalMediaCache> {
  return db.externalMediaCache.update({
    where: {
      id: photoId,
      visibilityStatus: "HIDDEN_BY_BUSINESS", // Guard: cannot restore system-hidden photos
    },
    data: { visibilityStatus: "VISIBLE" },
  });
}

/**
 * Hides a photo — sets visibilityStatus = HIDDEN_BY_SYSTEM.
 * Used by admin moderation.
 */
export async function hidePhotoBySystem(
  photoId: string,
  reason: string,
): Promise<ExternalMediaCache> {
  void reason; // reason is logged by caller for audit purposes
  return db.externalMediaCache.update({
    where: { id: photoId },
    data: { visibilityStatus: "HIDDEN_BY_SYSTEM" },
  });
}

/**
 * Toggles the isFeaturedByBusiness flag.
 * Featured photos may appear more prominently in the UI but remain Google-attributed.
 */
export async function setPhotoFeatured(
  photoId: string,
  featured: boolean,
): Promise<ExternalMediaCache> {
  return db.externalMediaCache.update({
    where: { id: photoId },
    data: { isFeaturedByBusiness: featured },
  });
}

/**
 * Batch-updates displayOrder for a business's Google photos.
 * @param orderedIds - Photo IDs in the desired display order
 */
export async function reorderPhotos(
  businessId: string,
  orderedIds: string[],
): Promise<void> {
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.externalMediaCache.update({
        where: { id, businessId }, // businessId guard prevents cross-business updates
        data: { displayOrder: index },
      }),
    ),
  );
}

// ── Cleanup operations ────────────────────────────────────────────────────────

/**
 * Hard-deletes expired media cache entries (where expiresAt < now).
 * Called by the /api/internal/cache-cleanup route.
 *
 * Note: Prisma deleteMany does not support take/limit — batchSize is a documented
 * soft limit. For large deployments, switch to raw SQL with LIMIT.
 *
 * @param batchSize - Documented limit (not enforced at DB level by Prisma)
 * @returns Number of deleted records
 */
export async function expirePhotos(batchSize?: number): Promise<number> {
  void batchSize; // documented soft limit — Prisma deleteMany has no LIMIT support
  const result = await db.externalMediaCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
