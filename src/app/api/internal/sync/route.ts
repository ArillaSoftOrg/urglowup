/**
 * Internal sync endpoint — finds connections due for a sync and processes them.
 *
 * Route:   GET /api/internal/sync
 * Access:  Internal only — NOT publicly callable
 *
 * Authentication (two accepted paths, checked in order):
 *   1. x-internal-secret header matching INTERNAL_API_SECRET env var (timingSafeEqual)
 *   2. Vercel Cron user-agent fallback: "vercel-cron/1.0"
 *
 * Security rule: if the secret header is present but wrong, the request is DENIED
 * regardless of user-agent — the user-agent path cannot bypass a failed secret check.
 *
 * Cron schedule: every 15 minutes (schedule "every15min" in vercel.json)
 * Batch size: SYNC_BATCH_SIZE (5) connections per invocation — spreads work across the day.
 * nextSyncAt is set to now+24h after each successful sync so each business is synced at most once/day.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  INTERNAL_SECRET_HEADER,
  SYNC_BATCH_SIZE,
  SYNC_STUCK_THRESHOLD_MINUTES,
  SYNC_RETRY_INTERVAL_MS,
} from "@/lib/constants/external";
import {
  getConnectionsDueForSync,
  getStuckSyncingConnections,
  updateConnection,
} from "@/lib/external/connection-service";
import { syncConnection } from "@/lib/external/google/sync-worker";

/**
 * Validates the request is from an authorised caller.
 *
 * Priority:
 *   1. If x-internal-secret header is present: compare with INTERNAL_API_SECRET using
 *      timingSafeEqual. DENY if wrong — user-agent fallback is NOT consulted.
 *   2. If no secret header: accept Vercel Cron user-agent ("vercel-cron/1.0").
 *   3. Otherwise: deny.
 */
function isAuthorised(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = request.headers.get(INTERNAL_SECRET_HEADER);

  if (provided !== null) {
    // Header is present — must match secret (if configured)
    if (!secret) return false; // secret not configured → deny header-based calls
    try {
      const a = Buffer.from(secret, "utf8");
      const b = Buffer.from(provided, "utf8");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  // No secret header — fall back to Vercel Cron user-agent
  const ua = request.headers.get("user-agent") ?? "";
  return ua.startsWith("vercel-cron/");
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();
  let stuckReset = 0;
  let totalReviewsSynced = 0;
  let totalPhotosSynced = 0;
  let totalErrors = 0;

  // Reset connections stuck in SYNCING (likely crashed workers)
  const stuckConnections = await getStuckSyncingConnections(
    SYNC_STUCK_THRESHOLD_MINUTES,
  );
  for (const stuck of stuckConnections) {
    await updateConnection(stuck.id, {
      syncStatus: "ERROR",
      lastError: "Sync timed out — will retry",
      nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
    });
    stuckReset++;
  }

  // Find due connections (up to SYNC_BATCH_SIZE)
  const dueConnections = await getConnectionsDueForSync(now, SYNC_BATCH_SIZE);

  // Process sequentially — no parallel to respect Google API rate limits
  for (const connection of dueConnections) {
    const result = await syncConnection(connection.id);
    totalReviewsSynced += result.reviewsSynced;
    totalPhotosSynced += result.photosSynced;
    if (result.errors.length > 0) totalErrors++;
  }

  return NextResponse.json({
    processed: dueConnections.length,
    reviewsSynced: totalReviewsSynced,
    photosSynced: totalPhotosSynced,
    errors: totalErrors,
    stuckReset,
    timestamp: new Date().toISOString(),
  });
}
