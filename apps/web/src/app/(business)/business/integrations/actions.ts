"use server";

import { requireBusiness } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { MANUAL_SYNC_COOLDOWN_MS } from "@/lib/constants/external";
import { getConnection } from "@/lib/external/connection-service";
import { syncConnection } from "@/lib/external/google/sync-worker";

export type ManualSyncResult =
  | { success: true; reviewsSynced: number; photosSynced: number }
  | {
      success: false;
      error:
        | "no_connection"
        | "not_connected"
        | "sync_in_progress"
        | "cooldown"
        | "sync_failed";
      nextAllowedAt?: Date;
      message?: string;
    };

/**
 * Triggers a manual sync of the business's Google Business Profile data.
 *
 * Guards (in order):
 *   1. No connection → error: no_connection
 *   2. Connection status !== ACTIVE → error: not_connected
 *   3. syncStatus === SYNCING → error: sync_in_progress
 *   4. lastSyncAt within 6-hour cooldown → error: cooldown
 *
 * Cooldown is enforced against lastSyncAt — no separate DB field needed.
 * "Max 1 manual sync per 24h" is deferred to a later phase.
 */
export async function triggerManualSyncAction(): Promise<ManualSyncResult> {
  const { businessId } = await requireBusiness("OWNER");

  const connection = await getConnection(businessId, "GOOGLE_BUSINESS_PROFILE");

  if (!connection) {
    return { success: false, error: "no_connection" };
  }

  if (connection.status !== "ACTIVE") {
    return { success: false, error: "not_connected" };
  }

  if (connection.syncStatus === "SYNCING") {
    return { success: false, error: "sync_in_progress" };
  }

  // Cooldown check — 6 hours between manual syncs
  if (connection.lastSyncAt) {
    const nextAllowedAt = new Date(
      connection.lastSyncAt.getTime() + MANUAL_SYNC_COOLDOWN_MS,
    );
    if (nextAllowedAt > new Date()) {
      return {
        success: false,
        error: "cooldown",
        nextAllowedAt,
      };
    }
  }

  const result = await syncConnection(connection.id);

  revalidatePath("/business/integrations");

  if (result.errors.length > 0 && result.reviewsSynced === 0 && result.photosSynced === 0) {
    return {
      success: false,
      error: "sync_failed",
      message: result.errors[0],
    };
  }

  return {
    success: true,
    reviewsSynced: result.reviewsSynced,
    photosSynced: result.photosSynced,
  };
}
