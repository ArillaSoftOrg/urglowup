/**
 * Google Business Profile API client.
 *
 * Responsibilities:
 *   - fetchGoogleReviews: Fetch the first page of reviews for a location
 *   - fetchGoogleMediaItems: Fetch the first page of media items for a location
 *
 * Security rules:
 *   - Access tokens are NEVER logged or included in error messages
 *   - safeReadErrorMessage reads only the error.message field from JSON bodies
 *   - GoogleApiError carries the HTTP status and a safe message only
 *
 * Retry strategy: exponential backoff with full jitter, up to MAX_RETRY_ATTEMPTS.
 * Only retryable status codes (429, 500–504) are retried.
 */
import {
  GOOGLE_MY_BUSINESS_REVIEWS_API,
  GOOGLE_MAX_REVIEWS_PER_FETCH,
  GOOGLE_MAX_PHOTOS_PER_FETCH,
} from "@/lib/constants/external";
import type { GoogleReviewsListRaw, GoogleMediaListRaw } from "./types";
import {
  isRetryableStatusCode,
  canRetry,
  calculateBackoffMs,
  delay,
} from "./rate-limit";

// ── Custom error class ────────────────────────────────────────────────────────

export class GoogleApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Reads a safe error message from a failed API response.
 * Only extracts the `error.message` field — never logs raw bodies or auth values.
 */
async function safeReadErrorMessage(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as {
      error?: { message?: string } | string;
    };
    if (typeof json.error === "object" && json.error?.message) {
      return json.error.message;
    }
    if (typeof json.error === "string") return json.error;
  } catch {
    // Body unreadable
  }
  return `HTTP ${res.status}`;
}

/**
 * Makes a GET request to the Google Business Profile API with retry logic.
 * Throws GoogleApiError on non-retryable failures or exhausted retries.
 *
 * @param url - Full endpoint URL
 * @param accessToken - Bearer token (never logged)
 */
async function googleGet<T>(url: string, accessToken: string): Promise<T> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  let attempt = 0;

  while (true) {
    const res = await fetch(url, { headers });

    if (res.ok) {
      return (await res.json()) as T;
    }

    if (!isRetryableStatusCode(res.status) || !canRetry(attempt)) {
      const message = await safeReadErrorMessage(res);
      throw new GoogleApiError(res.status, message);
    }

    await delay(calculateBackoffMs(attempt));
    attempt++;
  }
}

// ── Public API functions ──────────────────────────────────────────────────────

/**
 * Fetches the first page of reviews for a location.
 *
 * MVP: Only the first page (up to GOOGLE_MAX_REVIEWS_PER_FETCH = 50) is fetched.
 * If nextPageToken is present in the response it is ignored — multi-page support deferred.
 *
 * @param accessToken  - Plaintext access token (never log this)
 * @param accountId    - Google account ID (e.g. "123456789")
 * @param locationId   - Google location ID (e.g. "987654321")
 * @param pageToken    - Optional page token for pagination (unused in MVP)
 */
export async function fetchGoogleReviews(
  accessToken: string,
  accountId: string,
  locationId: string,
  // pageToken is accepted for future use but not currently passed to the API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pageToken?: string,
): Promise<GoogleReviewsListRaw> {
  const url =
    `${GOOGLE_MY_BUSINESS_REVIEWS_API}/accounts/${accountId}/locations/${locationId}/reviews` +
    `?pageSize=${GOOGLE_MAX_REVIEWS_PER_FETCH}`;

  return googleGet<GoogleReviewsListRaw>(url, accessToken);
}

/**
 * Fetches the first page of media items for a location.
 *
 * MVP: Only the first page (up to GOOGLE_MAX_PHOTOS_PER_FETCH = 20) is fetched.
 * nextPageToken is ignored — multi-page support deferred.
 *
 * @param accessToken  - Plaintext access token (never log this)
 * @param accountId    - Google account ID
 * @param locationId   - Google location ID
 * @param pageToken    - Optional page token for pagination (unused in MVP)
 */
export async function fetchGoogleMediaItems(
  accessToken: string,
  accountId: string,
  locationId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pageToken?: string,
): Promise<GoogleMediaListRaw> {
  const url =
    `${GOOGLE_MY_BUSINESS_REVIEWS_API}/accounts/${accountId}/locations/${locationId}/media` +
    `?pageSize=${GOOGLE_MAX_PHOTOS_PER_FETCH}`;

  return googleGet<GoogleMediaListRaw>(url, accessToken);
}
