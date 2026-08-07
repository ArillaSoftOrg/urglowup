/**
 * Internal rating recalculation endpoint.
 *
 * Recalculates time-decay-weighted Bayesian scores for all businesses that have
 * at least one approved UrGlowUp review and writes the results to BusinessRatingStats.
 *
 * Route:   GET /api/internal/rating-recalc
 * Access:  Internal only — NOT publicly callable
 *
 * Authentication (two accepted paths, checked in order):
 *   1. x-internal-secret header matching INTERNAL_API_SECRET env var (timingSafeEqual)
 *   2. Vercel Cron user-agent fallback: "vercel-cron/1.0"
 *
 * Security rule: if the secret header is present but wrong, the request is DENIED
 * regardless of user-agent — the user-agent path cannot bypass a failed secret check.
 *
 * Cron schedule: daily at 04:00 UTC (0 4 * * * in vercel.json)
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { INTERNAL_SECRET_HEADER } from "@/lib/constants/external";
import { recalculateAllStats } from "@/lib/ratings/calculator";

export const dynamic = "force-dynamic";

function isAuthorised(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = request.headers.get(INTERNAL_SECRET_HEADER);

  if (provided !== null) {
    if (!secret) return false;
    try {
      const a = Buffer.from(secret, "utf8");
      const b = Buffer.from(provided, "utf8");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  const ua = request.headers.get("user-agent") ?? "";
  return ua.startsWith("vercel-cron/");
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { processed, globalAverage } = await recalculateAllStats();

  return NextResponse.json({
    processed,
    globalAverage,
    timestamp: new Date().toISOString(),
  });
}
