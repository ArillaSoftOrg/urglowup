/**
 * Internal push-receipt polling endpoint.
 *
 * Expo push delivery is two-step: sending returns a *ticket* immediately
 * (only catches malformed/already-known-invalid tokens synchronously);
 * delivery-time failures like DeviceNotRegistered only appear in a
 * *receipt*, fetchable 15 minutes to a day after the ticket was issued.
 * This checks pending PushTicket rows (packages/domain/src/notifications/push.ts's
 * sendPushToUser persists one per successfully-queued send) and prunes
 * DeviceToken rows whose delivery failed with DeviceNotRegistered.
 *
 * Route:   GET /api/internal/push-receipts
 * Access:  Internal only — NOT publicly callable
 *
 * Authentication (two accepted paths, checked in order):
 *   1. x-internal-secret header matching INTERNAL_API_SECRET env var (timingSafeEqual)
 *   2. Vercel Cron user-agent fallback: "vercel-cron/1.0"
 *
 * Cron schedule: every 30 minutes (star-slash-30 * * * * in vercel.json)
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { INTERNAL_SECRET_HEADER } from "@/lib/constants/external";
import { checkPushReceipts } from "@urglowup/domain/notifications";

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

  const result = await checkPushReceipts();

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
