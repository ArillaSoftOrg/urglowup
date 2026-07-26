import "server-only";

import { GOOGLE_PLACES_DETAILS_API } from "@/lib/constants/external";

const PLACES_REVIEWS_FIELD_MASK = "reviews";
const PLACES_REVIEWS_TIMEOUT_MS = 6_000;

type LocalizedText = {
  text?: string;
  languageCode?: string;
};

type GooglePlacesReviewResponse = {
  reviews?: Array<{
    name?: string;
    relativePublishTimeDescription?: string;
    text?: LocalizedText;
    originalText?: LocalizedText;
    rating?: number;
    authorAttribution?: {
      displayName?: string;
      uri?: string;
      photoUri?: string;
    };
    publishTime?: string;
    flagContentUri?: string;
    googleMapsUri?: string;
  }>;
};

export type GooglePlacesReview = {
  id: string;
  rating: number;
  comment: string | null;
  originalComment: string | null;
  isTranslated: boolean;
  reviewerDisplayName: string;
  reviewerProfilePhotoUrl: string | null;
  reviewerProfileUrl: string | null;
  createTime: Date | null;
  relativePublishTimeDescription: string | null;
  merchantReply: string | null;
  attribution: "Google Maps";
  sourceUrl: string | null;
  reportUrl: string | null;
};

function resolvePlacesApiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    null
  );
}

function safeHttpsUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizePlacesReviews(
  response: GooglePlacesReviewResponse,
): GooglePlacesReview[] {
  return (response.reviews ?? []).flatMap((review, index) => {
    const rating = Number(review.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return [];

    const localizedComment = review.text?.text?.trim() || null;
    const originalComment = review.originalText?.text?.trim() || null;
    const isTranslated =
      Boolean(localizedComment && originalComment) &&
      (localizedComment !== originalComment ||
        review.text?.languageCode !== review.originalText?.languageCode);

    return [
      {
        id: review.name || `google-place-review-${index}`,
        rating,
        comment: localizedComment ?? originalComment,
        originalComment: isTranslated ? originalComment : null,
        isTranslated,
        reviewerDisplayName:
          review.authorAttribution?.displayName?.trim() || "Google kullanıcısı",
        reviewerProfilePhotoUrl: safeHttpsUrl(
          review.authorAttribution?.photoUri,
        ),
        reviewerProfileUrl: safeHttpsUrl(review.authorAttribution?.uri),
        createTime: parseDate(review.publishTime),
        relativePublishTimeDescription:
          review.relativePublishTimeDescription?.trim() || null,
        merchantReply: null,
        attribution: "Google Maps" as const,
        sourceUrl: safeHttpsUrl(review.googleMapsUri),
        reportUrl: safeHttpsUrl(review.flagContentUri),
      },
    ];
  });
}

/**
 * Reads Google Places review content at request time.
 *
 * Google Maps Platform content is intentionally not persisted or placed in the
 * application cache. Place IDs are the only data from this flow stored by the
 * application.
 */
export async function fetchGooglePlacesReviews(
  placeId: string,
  languageCode = "tr",
): Promise<GooglePlacesReview[]> {
  const apiKey = resolvePlacesApiKey();
  if (!apiKey || !placeId.trim()) return [];

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    PLACES_REVIEWS_TIMEOUT_MS,
  );

  try {
    const url = new URL(
      `${GOOGLE_PLACES_DETAILS_API}/${encodeURIComponent(placeId)}`,
    );
    url.searchParams.set("languageCode", languageCode);
    url.searchParams.set("regionCode", "TR");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACES_REVIEWS_FIELD_MASK,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn("[places-reviews] Google Places request failed", {
        status: response.status,
        placeId,
      });
      return [];
    }

    return normalizePlacesReviews(
      (await response.json()) as GooglePlacesReviewResponse,
    );
  } catch (error) {
    console.warn("[places-reviews] Google Places request failed", {
      placeId,
      reason:
        error instanceof Error && error.name === "AbortError"
          ? "timeout"
          : "network_error",
    });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
