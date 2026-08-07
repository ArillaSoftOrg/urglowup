/**
 * Response caching layer with Redis backing and in-memory fallback.
 *
 * Caches API responses, query results, and computed data to reduce database
 * load and improve response times. TTLs are conservative to avoid stale data.
 */

// In-memory cache: key → { value, expiresAt }
const inMemoryCache = new Map<string, { value: unknown; expiresAt: number }>();

export interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[]; // For invalidating related entries
}

const DEFAULT_TTL_SECONDS = 300; // 5 minutes
const CLEANUP_INTERVAL_MS = 60000; // Clean up every minute

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, entry] of inMemoryCache.entries()) {
    if (entry.expiresAt < now) {
      inMemoryCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.debug(`[cache] Cleaned up ${cleanedCount} expired entries`);
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Get a value from cache (Redis or in-memory).
 */
export async function getCached<T>(key: string): Promise<T | null> {
  // Try Redis first
  try {
    const { getRedisClient } = await import("@/lib/redis");
    const redis = await getRedisClient();

    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    }
  } catch (err) {
    console.debug("[cache] Redis get failed, trying in-memory", { key, err });
  }

  // Fallback to in-memory
  const entry = inMemoryCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as T;
  }

  return null;
}

/**
 * Set a value in cache (Redis and in-memory).
 */
export async function setCached<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void> {
  const ttlSeconds = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const serialized = JSON.stringify(value);

  // Set in Redis if available
  try {
    const { getRedisClient } = await import("@/lib/redis");
    const redis = await getRedisClient();

    if (redis) {
      await redis.setEx(key, ttlSeconds, serialized);
    }
  } catch (err) {
    console.debug("[cache] Redis set failed, using in-memory only", {
      key,
      err,
    });
  }

  // Always set in-memory as fallback
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidate cache entries by prefix or tag.
 * Useful for cache busting after mutations.
 */
export async function invalidateCache(keyPrefix: string): Promise<void> {
  // Clear in-memory
  for (const key of inMemoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      inMemoryCache.delete(key);
    }
  }

  // Clear Redis if available
  try {
    const { getRedisClient } = await import("@/lib/redis");
    const redis = await getRedisClient();

    if (redis) {
      const keys = await redis.keys(`${keyPrefix}*`);
      if (keys.length > 0) {
        // Delete keys: redis.del accepts array or variadic args
        await redis.del(keys);
      }
    }
  } catch (err) {
    console.debug("[cache] Redis invalidation failed", { keyPrefix, err });
  }
}

/**
 * Get cache statistics for monitoring.
 */
export function getCacheStats(): {
  inMemorySize: number;
  inMemoryMaxAge: number;
} {
  let maxAge = 0;

  for (const entry of inMemoryCache.values()) {
    const age = entry.expiresAt - Date.now();
    if (age > maxAge) {
      maxAge = age;
    }
  }

  return {
    inMemorySize: inMemoryCache.size,
    inMemoryMaxAge: Math.max(0, maxAge),
  };
}
