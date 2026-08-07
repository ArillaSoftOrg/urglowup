/**
 * Internal holiday sync endpoint — fetches TR public holidays from nager.date
 * and upserts them into PublicHoliday. Syncs current year + next year.
 *
 * Route:   GET /api/internal/holiday-sync
 * Access:  Internal only — NOT publicly callable
 *
 * Authentication: same pattern as other /api/internal/* routes:
 *   1. x-internal-secret header matching INTERNAL_API_SECRET env var
 *   2. Vercel Cron user-agent fallback: "vercel-cron/1.0"
 *
 * Cron schedule: daily at 01:00 UTC (see vercel.json)
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { INTERNAL_SECRET_HEADER } from "@/lib/constants/external";
import { syncTRHolidays } from "@/lib/holidays";

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

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const [current, next] = await Promise.all([
    syncTRHolidays(currentYear),
    syncTRHolidays(nextYear),
  ]);

  return NextResponse.json({
    currentYear: { year: currentYear, ...current },
    nextYear: { year: nextYear, ...next },
    timestamp: new Date().toISOString(),
  });
}
