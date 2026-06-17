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

// ── In-Memory Token Bucket Rate Limiter ────────────────────────────────────────

/** Per-business rate limit bucket state */
interface TokenBucket {
  tokens: number;
  lastRefillMs: number;
}

/**
 * Token bucket state: businessId → bucket.
 *
 * PHASE 18 MVP: In-memory, per-process. Survives pod restarts.
 * PHASE 19+: Migrate to Redis/Upstash for distributed state across pods.
 *
 * Rate limit: 10 requests per minute per business (sustainable for sync jobs)
 */
const TOKEN_BUCKETS = new Map<string, TokenBucket>();

const TOKENS_PER_MINUTE = 10;
const REFILL_RATE_PER_MS = TOKENS_PER_MINUTE / (60 * 1000); // tokens/ms
const MAX_BURST = TOKENS_PER_MINUTE; // Allow burst up to the limit

/** Result shape for rate limit checks */
export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterMs?: number;
  remainingRequests?: number;
}

/**
 * Checks whether a Google API request is within rate limits for the given business.
 *
 * Uses token bucket algorithm:
 * - Each business gets a bucket with capacity = TOKENS_PER_MINUTE
 * - Tokens refill at REFILL_RATE_PER_MS per millisecond
 * - Each request costs 1 token
 * - If tokens available, allow and deduct; otherwise return retryAfter
 *
 * PHASE 18 MVP: In-memory token buckets (per-process).
 * Limitation: Does not survive pod restarts; consider distributed state for Phase 19+
 *
 * @param businessId - Business identifier for rate limit bucket
 * @returns { allowed, retryAfterMs?, remainingRequests? }
 */
export function checkRateLimit(businessId: string): RateLimitCheckResult {
  const now = Date.now();

  // Get or create bucket for this business
  let bucket = TOKEN_BUCKETS.get(businessId);
  if (!bucket) {
    bucket = { tokens: MAX_BURST, lastRefillMs: now };
    TOKEN_BUCKETS.set(businessId, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsedMs = now - bucket.lastRefillMs;
  const tokensToAdd = elapsedMs * REFILL_RATE_PER_MS;
  bucket.tokens = Math.min(MAX_BURST, bucket.tokens + tokensToAdd);
  bucket.lastRefillMs = now;

  // Check if request is allowed
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remainingRequests: Math.floor(bucket.tokens),
    };
  }

  // Compute retry-after: time until 1 token is available
  const tokensNeeded = 1 - bucket.tokens;
  const retryAfterMs = Math.ceil(tokensNeeded / REFILL_RATE_PER_MS);

  return {
    allowed: false,
    retryAfterMs,
    remainingRequests: 0,
  };
}

/**
 * Clear rate limit state for a business (e.g., after quota reset).
 * Useful for testing and emergency resets.
 */
export function resetRateLimit(businessId: string): void {
  TOKEN_BUCKETS.delete(businessId);
}
