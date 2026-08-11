/**
 * Internal holiday sync endpoint — fetches TR public holidays from nager.date
 * and upserts them into PublicHoliday. Syncs current year + next year.
 *
 * Route:   GET /api/internal/holiday-sync
 * Access:  Internal only — NOT publicly callable
 *
 * Authentication: x-internal-secret header matching INTERNAL_API_SECRET
 * env var (timing-safe comparison), enforced by lib/internal-auth.ts.
 * No User-Agent fallback — see that file's doc comment for why.
 *
 * Cron schedule: daily at 01:00 UTC (see vercel.json)
 */
import { NextResponse } from "next/server";
import { syncTRHolidays } from "@/lib/holidays";
import { isInternalRequestAuthorized, unauthorizedInternalResponse } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isInternalRequestAuthorized(request)) {
    return unauthorizedInternalResponse();
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
