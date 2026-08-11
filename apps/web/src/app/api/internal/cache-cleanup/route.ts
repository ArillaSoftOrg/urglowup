/**
 * Internal cache cleanup endpoint.
 *
 * Deletes expired ExternalReviewCache and ExternalMediaCache records whose
 * expiresAt < now(). Records expire 30 days after they were fetched.
 *
 * Authentication: x-internal-secret header matching INTERNAL_API_SECRET
 * env var (timing-safe comparison), enforced by lib/internal-auth.ts.
 * Returns 401 (not 403) on unauthorised requests — avoids confirming the route exists.
 *
 * Route:   GET /api/internal/cache-cleanup
 * Access:  Internal only — call from a Vercel Cron or scheduled GitHub Action.
 *
 * Cron schedule: daily at 02:00 UTC (0 2 * * * in vercel.json)
 */
import { NextResponse } from "next/server";
import { CACHE_CLEANUP_BATCH_SIZE } from "@/lib/constants/external";
import { expireReviews } from "@/lib/external/review-cache-service";
import { expirePhotos } from "@/lib/external/media-cache-service";
import { isInternalRequestAuthorized, unauthorizedInternalResponse } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isInternalRequestAuthorized(request)) {
    return unauthorizedInternalResponse();
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
