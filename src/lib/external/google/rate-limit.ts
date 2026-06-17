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
 * ⚠️  SECURITY STUB: Currently always allows all requests (no enforcement).
 *
 * Phase 15 (current): No-op stub to allow feature development without quota concerns.
 * Phase 16 (deferred): Implement token-bucket (or leaky-bucket) rate limiting backed by
 * Redis or DB to protect against quota exhaustion on Google My Business API calls.
 *
 * Until Phase 16 is complete, there is ZERO protection against quota exhaustion.
 * A burst of concurrent profile fetches could exhaust the daily quota.
 */
export function checkRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _businessId: string,
): RateLimitCheckResult {
  // TODO: Phase 16 — Implement token-bucket rate limiter backed by KV store (Redis / Vercel KV)
  return { allowed: true };
}
