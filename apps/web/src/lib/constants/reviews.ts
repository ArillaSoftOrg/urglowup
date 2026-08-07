import type { ReviewStatus } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

export const MIN_RATING = 0;
export const MAX_RATING = 10;
// Kept in sync with packages/domain/src/reviews/constants.ts by hand — this
// file is imported by client components, so it can't re-export from the
// server-only domain package.
export const MAX_COMMENT_LENGTH = 1000;

/** Labels for the 5 star positions (each star = 2 points on the 0–10 scale) */
export const RATING_LABELS: Record<number, string> = {
  2:  "Kötü",
  4:  "Orta",
  6:  "İyi",
  8:  "Çok İyi",
  10: "Mükemmel",
};

/** Returns a human-readable quality label for any 0–10 float rating */
export function getRatingLabel(rating: number): string {
  if (rating >= 9) return "Mükemmel";
  if (rating >= 7) return "Çok İyi";
  if (rating >= 5) return "İyi";
  if (rating >= 3) return "Orta";
  return "Kötü";
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandı",
  HIDDEN: "Gizlendi",
  REMOVED: "Kaldırıldı",
};

export const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  HIDDEN: "bg-gray-100 text-gray-800",
  REMOVED: "bg-red-100 text-red-800",
};

export const REVIEW_STATUS_VARIANTS: Record<ReviewStatus, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  HIDDEN: "neutral",
  REMOVED: "destructive",
};

/**
 * Statuses that allow the customer to edit their review. Kept in sync with
 * packages/domain/src/reviews/constants.ts by hand (see note above).
 */
export const EDITABLE_STATUSES: ReviewStatus[] = ["APPROVED", "PENDING"];

// ── Google / external source display ─────────────────────────────────────────

/** Label shown next to the Google star rating — kept separate from UrGlowUp rating */
export const GOOGLE_RATING_LABEL = "Google Rating";

/** Label shown next to the UrGlowUp star rating */
export const URGLOWUP_RATING_LABEL = "UrGlowUp Rating";

/**
 * Short badge label rendered on Google-sourced reviews.
 * Must always be displayed alongside Google review content.
 */
export const GOOGLE_REVIEW_SOURCE_LABEL = "Google";

/**
 * Attribution text for legal/compliance display near Google reviews.
 * Google's ToS requires attribution whenever reviews are shown.
 */
export const GOOGLE_REVIEW_ATTRIBUTION_TEXT =
  "Reviews sourced from Google Business Profile. " +
  "Displayed in accordance with Google's attribution requirements. " +
  "Google reviews are not used for UrGlowUp platform ranking or AI training.";

/** Tailwind classes for the Google source badge */
export const GOOGLE_BADGE_CLASS = "bg-blue-100 text-blue-800";

/** Badge variant for the Google source badge */
export const GOOGLE_BADGE_VARIANT: BadgeVariant = "info";
