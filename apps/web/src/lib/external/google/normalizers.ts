/**
 * Maps raw Google API responses to normalized shapes ready for DB upsert.
 *
 * Hard rules:
 *   - attribution is ALWAYS hardcoded as "Google" — never taken from API input
 *   - Reviews with STAR_RATING_UNSPECIFIED return null (caller must skip them)
 *   - Photos with policy violations (non-Google CDN URL) return null (caller must skip)
 *   - Normalized types are the ONLY shapes written to ExternalReviewCache / ExternalMediaCache
 */
import type {
  GoogleReviewRaw,
  GoogleMediaItemRaw,
  NormalizedGoogleReview,
  NormalizedGooglePhoto,
} from "./types";
import { starRatingToInt } from "./types";
import { assertGoogleCdnUrl, assertNotCloudinaryUrl } from "./policy";

// ── Review normalizer ─────────────────────────────────────────────────────────

/**
 * Maps a raw Google review to a NormalizedGoogleReview.
 *
 * Returns null when:
 *   - starRating === "STAR_RATING_UNSPECIFIED" (no numeric rating available)
 *
 * Attribution is always "Google" — never sourced from API response data.
 */
export function normalizeReview(
  raw: GoogleReviewRaw,
): NormalizedGoogleReview | null {
  const rating = starRatingToInt(raw.starRating);
  if (rating === null) {
    // STAR_RATING_UNSPECIFIED — skip this review
    return null;
  }

  return {
    providerReviewId: raw.reviewId,
    rating,
    comment: raw.comment ?? null,
    reviewerDisplayName: raw.reviewer.displayName,
    reviewerProfilePhotoUrl: raw.reviewer.profilePhotoUrl ?? null,
    createTime: raw.createTime ? new Date(raw.createTime) : null,
    updateTime: raw.updateTime ? new Date(raw.updateTime) : null,
    merchantReply: raw.reviewReply?.comment ?? null,
    attribution: "Google", // Always hardcoded — never from API input
    sourceUrl: null, // Google Maps deep-link construction deferred
  };
}

// ── Photo normalizer ──────────────────────────────────────────────────────────

/**
 * Maps a raw Google media item to a NormalizedGooglePhoto.
 *
 * Returns null when:
 *   - googleUrl fails the Google CDN or Cloudinary policy guards (photo is logged and skipped)
 *   - mediaFormat is MEDIA_FORMAT_UNSPECIFIED
 *
 * Policy guards are applied inline here AND again in upsertCachedPhoto — double guard.
 * Attribution is always "Google" — never sourced from API response data.
 */
export function normalizePhoto(
  raw: GoogleMediaItemRaw,
): NormalizedGooglePhoto | null {
  if (raw.mediaFormat === "MEDIA_FORMAT_UNSPECIFIED") {
    return null;
  }

  // Extract mediaItemId from the resource name
  // Name format: "accounts/{accountId}/locations/{locationId}/media/{mediaItemId}"
  const nameParts = raw.name.split("/");
  const providerMediaId = nameParts[nameParts.length - 1];
  if (!providerMediaId) {
    return null;
  }

  // Policy guards — applied before building the normalized shape
  try {
    assertNotCloudinaryUrl(
      raw.googleUrl,
      `normalizePhoto(providerMediaId=${providerMediaId})`,
    );
    assertGoogleCdnUrl(
      raw.googleUrl,
      `normalizePhoto(providerMediaId=${providerMediaId})`,
    );
  } catch (err) {
    // Log the providerMediaId for investigation, do not abort the batch
    console.warn(
      "[normalizePhoto] URL policy violation — skipping photo",
      { providerMediaId, error: err instanceof Error ? err.message : String(err) },
    );
    return null;
  }

  return {
    providerMediaId,
    mediaFormat: raw.mediaFormat,
    category: raw.locationAssociation?.category ?? null,
    sourceUrl: raw.googleUrl, // Google CDN URL — validated above
    thumbnailUrl: raw.thumbnailUrl ?? null,
    attribution: "Google", // Always hardcoded — never from API input
    createTime: raw.createTime ? new Date(raw.createTime) : null,
  };
}
