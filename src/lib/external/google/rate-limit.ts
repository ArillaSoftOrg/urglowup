/**
 * Rate limit constants and exponential backoff helpers for Google API calls.
 *
 * This module contains ONLY pure functions and constants — no state, no I/O.
 * Actual rate limit enforcement (token buckets, queues) is deferred to Phase 16.
 */
import {
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
  MAX_RETRY_ATTEMPTS,
} from "@/lib/constants/external";

export { MAX_RETRY_ATTEMPTS };

/**
 * Calculates exponential backoff with full jitter.
 *
 * Formula: min(BACKOFF_MAX_MS, BACKOFF_BASE_MS × 2^attempt) × random(0, 1)
 *
 * Full jitter prevents thundering-herd when multiple workers retry simultaneously.
 *
 * @param attempt - Zero-based attempt index (0 = first retry after initial failure)
 * @returns Milliseconds to wait before the next attempt
 */
export function calculateBackoffMs(attempt: number): number {
  const capped = Math.max(0, Math.min(attempt, 10)); // Guard against overflow
  const exponential = BACKOFF_BASE_MS * Math.pow(2, capped);
  const ceiling = Math.min(exponential, BACKOFF_MAX_MS);
  return Math.floor(ceiling * Math.random());
}

/**
 * Deterministic variant of calculateBackoffMs — no random jitter.
 * Use in tests to avoid flakiness from randomness.
 *
 * @param attempt - Zero-based attempt index
 * @returns Milliseconds (deterministic)
 */
export function calculateBackoffMsDeterministic(attempt: number): number {
  const capped = Math.max(0, Math.min(attempt, 10));
  const exponential = BACKOFF_BASE_MS * Math.pow(2, capped);
  return Math.min(exponential, BACKOFF_MAX_MS);
}

/**
 * Returns true if the HTTP status code warrants a retry.
 * - 429: Too Many Requests (rate limited)
 * - 500–504: Transient server errors
 */
export function isRetryableStatusCode(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 504);
}

/**
 * Returns true if more retry attempts are available.
 *
 * @param attempt - Zero-based attempt index that just failed
 */
export function canRetry(attempt: number): boolean {
  return attempt < MAX_RETRY_ATTEMPTS;
}

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 * Used in retry loops: await delay(calculateBackoffMs(attempt))
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Rate limit check stub ─────────────────────────────────────────────────────

/** Result shape for rate limit checks */
export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterMs?: number;
  remainingRequests?: number;
}

/**
 * Checks whether a Google API request is within rate limits for the given business.
 *
 * Phase 15: Always returns allowed — no enforcement yet.
 * Phase 16: Replace with token-bucket implementation backed by a KV store.
 */
export function checkRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _businessId: string,
): RateLimitCheckResult {
  // TODO: Implement in Phase 16 with actual token bucket logic
  return { allowed: true };
}
