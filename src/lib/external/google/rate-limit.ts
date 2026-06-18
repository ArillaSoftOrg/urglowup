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

// ── Token Bucket Rate Limiter: Redis + In-Memory Fallback ────────────────────

/** Per-business rate limit bucket state (in-memory fallback) */
interface TokenBucket {
  tokens: number;
  lastRefillMs: number;
}

/**
 * Token bucket state: businessId → bucket.
 *
 * PHASE 20: Redis/Upstash for distributed state across pods.
 * Fallback: In-memory buckets if Redis unavailable.
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
 * PHASE 20: Uses Redis if available (distributed), falls back to in-memory.
 *
 * @param businessId - Business identifier for rate limit bucket
 * @returns { allowed, retryAfterMs?, remainingRequests? }
 */
export async function checkRateLimit(
  businessId: string
): Promise<RateLimitCheckResult> {
  const now = Date.now();

  // Try Redis first
  try {
    const { getRedisClient } = await import("@/lib/redis");
    const redis = await getRedisClient();

    if (redis) {
      return await checkRateLimitRedis(redis, businessId, now);
    }
  } catch (err) {
    console.error("[rate-limit] Redis check failed, falling back to in-memory:", err);
  }

  // Fallback to in-memory
  return checkRateLimitInMemory(businessId, now);
}

/**
 * In-memory token bucket check (fallback when Redis unavailable)
 */
function checkRateLimitInMemory(
  businessId: string,
  now: number
): RateLimitCheckResult {
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
 * Redis-backed token bucket check using Lua script for atomicity
 */
async function checkRateLimitRedis(
  redis: any,
  businessId: string,
  now: number
): Promise<RateLimitCheckResult> {
  const key = `rate_limit:${businessId}`;

  // Lua script for atomic token bucket operation
  // Returns: [allowed, remainingTokens, retryAfterMs]
  const luaScript = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local tokens_per_minute = tonumber(ARGV[2])
local refill_rate = tonumber(ARGV[3])
local max_burst = tonumber(ARGV[4])

-- Get current bucket state
local bucket = redis.call('HGETALL', key)
local tokens = tonumber(bucket[2] or max_burst)
local last_refill = tonumber(bucket[4] or now)

-- Refill tokens
local elapsed = math.max(0, now - last_refill)
local tokens_to_add = elapsed * refill_rate
tokens = math.min(max_burst, tokens + tokens_to_add)

-- Check if allowed
if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HSET', key, 'tokens', tokens, 'lastRefillMs', now)
  redis.call('EXPIRE', key, 3600)
  return {1, math.floor(tokens), 0}
else
  redis.call('HSET', key, 'tokens', tokens, 'lastRefillMs', now)
  redis.call('EXPIRE', key, 3600)
  local tokens_needed = 1 - tokens
  local retry_after_ms = math.ceil(tokens_needed / refill_rate)
  return {0, 0, retry_after_ms}
end
  `;

  try {
    const result = await redis.eval(luaScript, {
      keys: [key],
      arguments: [
        now.toString(),
        TOKENS_PER_MINUTE.toString(),
        REFILL_RATE_PER_MS.toString(),
        MAX_BURST.toString(),
      ],
    });

    const [allowed, remainingTokens, retryAfterMs] = result;

    return {
      allowed: allowed === 1,
      remainingRequests: remainingTokens,
      retryAfterMs: retryAfterMs > 0 ? retryAfterMs : undefined,
    };
  } catch (err) {
    console.error("[rate-limit] Lua script failed:", err);
    // Fall back to in-memory on Redis error
    return checkRateLimitInMemory(businessId, now);
  }
}

/**
 * Clear rate limit state for a business (e.g., after quota reset).
 * Useful for testing and emergency resets.
 */
export async function resetRateLimit(businessId: string): Promise<void> {
  // Clear in-memory
  TOKEN_BUCKETS.delete(businessId);

  // Clear Redis if available
  try {
    const { getRedisClient } = await import("@/lib/redis");
    const redis = await getRedisClient();
    if (redis) {
      await redis.del(`rate_limit:${businessId}`);
    }
  } catch (err) {
    console.error("[rate-limit] Failed to clear Redis:", err);
  }
}
