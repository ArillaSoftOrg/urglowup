import { NextResponse } from "next/server";

/**
 * Cache header presets for different content types.
 * Follows HTTP caching best practices.
 */

export const CACHE_PRESETS = {
  // Public, immutable assets (images, fonts, JS bundles)
  IMMUTABLE: "public, max-age=31536000, immutable",

  // Public HTML pages (business profiles, etc)
  // Revalidate every hour; serve stale if revalidation fails
  PUBLIC_PAGE: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",

  // API responses - cache briefly with stale fallback
  // 5 minutes max, serve stale up to 1 hour
  API_RESPONSE: "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",

  // User-specific data (conversations, etc) - no cache
  PRIVATE_DATA: "private, no-cache, no-store, must-revalidate",

  // Search results - cache for 10 minutes
  SEARCH: "public, max-age=600, s-maxage=600",
};

/**
 * Set Cache-Control header on NextResponse.
 */
export function withCacheHeaders(
  response: NextResponse,
  preset: string
): NextResponse {
  response.headers.set("Cache-Control", preset);
  return response;
}

/**
 * Get Cache-Control header string for direct use.
 */
export function getCacheHeader(preset: string): string {
  return preset;
}
