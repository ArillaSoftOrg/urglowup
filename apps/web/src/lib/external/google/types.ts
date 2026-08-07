/**
 * TypeScript shapes for Google Business Profile API responses and cache layer.
 *
 * Architecture boundary:
 *   Raw API types (Google*Raw)  →  normalization  →  Normalized* types  →  DB cache
 *
 * These types must NEVER be returned directly to UI components.
 * UI components read from the DB cache (ExternalReviewCache, ExternalMediaCache).
 *
 * This file is server-only. Do not import in client components.
 */

// ── Raw Google API response shapes ───────────────────────────────────────────

/** Google My Business star rating string values */
export type GoogleStarRating =
  | "ONE"
  | "TWO"
  | "THREE"
  | "FOUR"
  | "FIVE"
  | "STAR_RATING_UNSPECIFIED";

export interface GoogleReviewerRaw {
  displayName: string;
  profilePhotoUrl?: string;
  isAnonymous?: boolean;
}

export interface GoogleReviewReplyRaw {
  comment: string;
  updateTime: string; // ISO 8601
}

/**
 * Single review from the Google My Business API v4.
 * Field names match the API response structure.
 */
export interface GoogleReviewRaw {
  name: string; // "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
  reviewId: string;
  reviewer: GoogleReviewerRaw;
  starRating: GoogleStarRating;
  comment?: string;
  createTime: string; // ISO 8601
  updateTime: string; // ISO 8601
  reviewReply?: GoogleReviewReplyRaw;
}

/** Response shape for the listReviews endpoint */
export interface GoogleReviewsListRaw {
  reviews?: GoogleReviewRaw[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
}

/** Google media format types */
export type GoogleMediaFormat = "PHOTO" | "VIDEO" | "MEDIA_FORMAT_UNSPECIFIED";

/** Google media categories */
export type GoogleMediaCategory =
  | "EXTERIOR"
  | "INTERIOR"
  | "PRODUCT"
  | "AT_WORK"
  | "FOOD_AND_DRINK"
  | "MENU"
  | "COMMON_AREA"
  | "ROOMS"
  | "TEAMS"
  | "ADDITIONAL"
  | "CATEGORY_UNSPECIFIED";

/**
 * Single media item from the Google My Business API.
 */
export interface GoogleMediaItemRaw {
  name: string; // "accounts/{accountId}/locations/{locationId}/media/{mediaItemId}"
  mediaFormat: GoogleMediaFormat;
  locationAssociation?: {
    category?: GoogleMediaCategory;
  };
  googleUrl: string; // Direct Google CDN URL — may expire
  thumbnailUrl?: string;
  createTime?: string; // ISO 8601
  insights?: {
    viewCount?: string; // Returned as string by the API
  };
}

/** Response shape for the listMediaItems endpoint */
export interface GoogleMediaListRaw {
  mediaItems?: GoogleMediaItemRaw[];
  totalMediaItemCount?: number;
  nextPageToken?: string;
}

// ── Normalized shapes (mapped from raw, ready for DB upsert) ─────────────────

/**
 * Normalized review ready for upsert into ExternalReviewCache.
 * - rating is converted from GoogleStarRating string to integer 1–5
 * - createTime / updateTime are converted to Date
 */
export interface NormalizedGoogleReview {
  providerReviewId: string;
  rating: number; // 1–5
  comment: string | null;
  reviewerDisplayName: string;
  reviewerProfilePhotoUrl: string | null;
  createTime: Date | null;
  updateTime: Date | null;
  merchantReply: string | null;
  attribution: string; // Always "Google"
  sourceUrl: string | null;
}

/**
 * Normalized photo ready for upsert into ExternalMediaCache.
 * - sourceUrl is the direct Google CDN URL — never a Cloudinary URL
 */
export interface NormalizedGooglePhoto {
  providerMediaId: string;
  mediaFormat: string;
  category: string | null;
  sourceUrl: string; // Google CDN URL only
  thumbnailUrl: string | null;
  attribution: string; // Always "Google"
  createTime: Date | null;
}

// ── Summary / aggregate shapes (computed from cache at query time) ────────────

/**
 * Summary stats for a business's Google reviews.
 * Computed from ExternalReviewCache — NEVER from the native Review table.
 * The two rating systems must never be merged.
 */
export interface GoogleReviewSummary {
  provider: "GOOGLE_BUSINESS_PROFILE";
  averageRating: number | null;
  totalCount: number;
  fetchedAt: Date | null;
  expiresAt: Date | null;
}

// ── Connection lifecycle input types ─────────────────────────────────────────

export interface CreateExternalConnectionInput {
  businessId: string;
  provider: "GOOGLE_BUSINESS_PROFILE";
  providerAccountId: string;
  providerAccountName?: string;
  providerLocationId?: string;
  providerLocationName?: string;
  placeId?: string;
  connectedByUserId: string;
  scopes: string[];
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date;
}

export interface UpdateExternalConnectionInput {
  providerAccountName?: string;
  providerLocationId?: string;
  providerLocationName?: string;
  placeId?: string;
  scopes?: string[];
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date;
  status?: "ACTIVE" | "EXPIRED" | "DISCONNECTED" | "ERROR";
  disconnectedAt?: Date | null;
  syncStatus?: "IDLE" | "SYNCING" | "ERROR";
  lastSyncAt?: Date;
  nextSyncAt?: Date | null;
  lastError?: string | null;
  showExternalReviews?: boolean;
  showExternalPhotos?: boolean;
}

// ── Star rating conversion ────────────────────────────────────────────────────

/**
 * Maps Google's string star rating to an integer 1–5.
 * STAR_RATING_UNSPECIFIED is not included — treat as null in normalization.
 */
export const GOOGLE_STAR_RATING_MAP: Record<
  Exclude<GoogleStarRating, "STAR_RATING_UNSPECIFIED">,
  number
> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

/**
 * Converts a GoogleStarRating string to an integer.
 * Returns null for STAR_RATING_UNSPECIFIED or unknown values.
 */
export function starRatingToInt(rating: GoogleStarRating): number | null {
  if (rating === "STAR_RATING_UNSPECIFIED") return null;
  return GOOGLE_STAR_RATING_MAP[rating] ?? null;
}
