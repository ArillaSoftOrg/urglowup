/**
 * Internal sync endpoint — finds connections due for a sync and processes them.
 *
 * Route:   GET /api/internal/sync
 * Access:  Internal only — NOT publicly callable
 *
 * Authentication: x-internal-secret header matching INTERNAL_API_SECRET
 * env var (timing-safe comparison), enforced by lib/internal-auth.ts.
 * No User-Agent fallback — see that file's doc comment for why.
 *
 * Cron schedule: every 15 minutes (schedule "every15min" in vercel.json)
 * Batch size: SYNC_BATCH_SIZE (5) connections per invocation — spreads work across the day.
 * nextSyncAt is set to now+24h after each successful sync so each business is synced at most once/day.
 */
import { NextResponse } from "next/server";
import {
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
import { isInternalRequestAuthorized, unauthorizedInternalResponse } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isInternalRequestAuthorized(request)) {
    return unauthorizedInternalResponse();
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
