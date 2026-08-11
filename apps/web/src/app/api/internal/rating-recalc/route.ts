/**
 * Internal rating recalculation endpoint.
 *
 * Recalculates time-decay-weighted Bayesian scores for all businesses that have
 * at least one approved UrGlowUp review and writes the results to BusinessRatingStats.
 *
 * Route:   GET /api/internal/rating-recalc
 * Access:  Internal only — NOT publicly callable
 *
 * Authentication: x-internal-secret header matching INTERNAL_API_SECRET
 * env var (timing-safe comparison), enforced by lib/internal-auth.ts.
 * No User-Agent fallback — see that file's doc comment for why.
 *
 * Cron schedule: daily at 04:00 UTC (0 4 * * * in vercel.json)
 */
import { NextResponse } from "next/server";
import { recalculateAllStats } from "@/lib/ratings/calculator";
import { isInternalRequestAuthorized, unauthorizedInternalResponse } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isInternalRequestAuthorized(request)) {
    return unauthorizedInternalResponse();
  }

  const { processed, globalAverage } = await recalculateAllStats();

  return NextResponse.json({
    processed,
    globalAverage,
    timestamp: new Date().toISOString(),
  });
}
