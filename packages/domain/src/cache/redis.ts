/**
 * Redis client adapter for rate limiting and caching.
 *
 * Supports distributed Redis (Upstash, local, etc) when REDIS_URL is set.
 * Falls back gracefully to in-memory buckets if Redis unavailable or not configured.
 *
 * NOTE: Redis package NOT required at build time; client is lazy-loaded only if
 * REDIS_URL environment variable is present. This allows the application to work
 * without Redis while supporting it when available.
 */

import type { RedisClientType } from "redis";

let redisClient: RedisClientType | null | undefined;

/**
 * Get or create Redis client.
 * Returns null if REDIS_URL not configured or redis package not available.
 * The caller (rate-limiter) will fall back to in-memory state.
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    redisClient = null;
    return null;
  }

  try {
    // Dynamically import redis only if URL is configured
    const { createClient } = await import("redis");

    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error("[redis] Max reconnection attempts exceeded");
            return new Error("Max Redis reconnection attempts");
          }
          return Math.min(retries * 50, 500);
        },
      },
    });

    redisClient.on("error", (err: Error) => {
      console.error("[redis] Client error:", err);
    });

    redisClient.on("connect", () => {
      console.log("[redis] Connected");
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.warn("[redis] Not configured or unavailable, using in-memory fallback", {
      error: err instanceof Error ? err.message : String(err),
    });
    redisClient = null;
    return null;
  }
}

/**
 * Close Redis connection gracefully.
 * Call during app shutdown.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (err) {
      console.error("[redis] Error closing connection:", err);
    }
    redisClient = null;
  }
}

/**
 * Check if Redis is available and connected.
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient?.isOpen === true;
}
