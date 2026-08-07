/**
 * Internal cache cleanup endpoint.
 *
 * Deletes expired ExternalReviewCache and ExternalMediaCache records whose
 * expiresAt < now(). Records expire 30 days after they were fetched.
 *
 * Authentication: requires the x-internal-secret header to match INTERNAL_API_SECRET.
 * Uses constant-time comparison to prevent timing attacks.
 * Returns 401 (not 403) on unauthorised requests — avoids confirming the route exists.
 *
 * Route:   GET /api/internal/cache-cleanup
 * Access:  Internal only — call from a Vercel Cron or scheduled GitHub Action.
 *
 * Cron schedule: daily at 02:00 UTC (0 2 * * * in vercel.json)
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { INTERNAL_SECRET_HEADER, CACHE_CLEANUP_BATCH_SIZE } from "@/lib/constants/external";
import { expireReviews } from "@/lib/external/review-cache-service";
import { expirePhotos } from "@/lib/external/media-cache-service";

export const dynamic = "force-dynamic";

/**
 * Validates the x-internal-secret header using constant-time comparison.
 * Returns false if INTERNAL_API_SECRET is not configured — fail closed.
 */
function isAuthorised(request: Request): boolean {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) return false;

  const provided = request.headers.get(INTERNAL_SECRET_HEADER);
  if (!provided) return false;

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    // Buffers must be same length for timingSafeEqual
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const [deletedReviews, deletedPhotos] = await Promise.all([
    expireReviews(CACHE_CLEANUP_BATCH_SIZE),
    expirePhotos(CACHE_CLEANUP_BATCH_SIZE),
  ]);

  return NextResponse.json({
    success: true,
    deletedReviews,
    deletedPhotos,
    batchSize: CACHE_CLEANUP_BATCH_SIZE,
    timestamp: new Date().toISOString(),
  });
}
