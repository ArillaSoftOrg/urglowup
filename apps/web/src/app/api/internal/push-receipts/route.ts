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
 * Authentication: x-internal-secret header matching INTERNAL_API_SECRET
 * env var (timing-safe comparison), enforced by lib/internal-auth.ts.
 * No User-Agent fallback — see that file's doc comment for why.
 *
 * Cron schedule: every 30 minutes (star-slash-30 * * * * in vercel.json)
 */
import { NextResponse } from "next/server";
import { checkPushReceipts } from "@urglowup/domain/notifications";
import { isInternalRequestAuthorized, unauthorizedInternalResponse } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isInternalRequestAuthorized(request)) {
    return unauthorizedInternalResponse();
  }

  const result = await checkPushReceipts();

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
