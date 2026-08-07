/**
 * CRUD operations for BusinessExternalConnection records.
 *
 * Connection status state machine:
 *   ACTIVE ──► EXPIRED       (token expiry detected during sync)
 *   ACTIVE ──► ERROR         (API call fails)
 *   ACTIVE ──► DISCONNECTED  (business owner disconnects)
 *   ERROR  ──► ACTIVE        (after successful token refresh)
 *   EXPIRED ──► ACTIVE       (after successful token refresh)
 *
 * Sync status state machine (independent of connection status):
 *   IDLE ──► SYNCING ──► IDLE   (successful sync)
 *                └──► ERROR     (sync failed)
 *   ERROR ──► SYNCING           (retry)
 *
 * Note: showExternalReviews / showExternalPhotos are business-controlled display
 * toggles — independent of both connection status and sync status. A business can
 * have an ACTIVE connection but choose not to display Google content on their profile.
 */
import type { BusinessExternalConnectionModel as BusinessExternalConnection } from "@/generated/prisma/models";
import type {
  CreateExternalConnectionInput,
  UpdateExternalConnectionInput,
} from "./google/types";
import { db } from "@/lib/db";

// Re-export input types for consumers
export type { CreateExternalConnectionInput, UpdateExternalConnectionInput };

export type ConnectionWithBusiness = BusinessExternalConnection & {
  business: { id: string; name: string; slug: string };
};

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetches the external connection for a given business and provider.
 * Returns null if no connection exists.
 * Does NOT filter by status — callers check status themselves.
 */
export async function getConnection(
  businessId: string,
  provider: "GOOGLE_BUSINESS_PROFILE",
): Promise<BusinessExternalConnection | null> {
  return db.businessExternalConnection.findUnique({
    where: { businessId_provider: { businessId, provider } },
  });
}

/**
 * Fetches up to batchSize ACTIVE connections that are due for a sync.
 * "Due" means nextSyncAt is null (never synced) or nextSyncAt <= cutoffTime.
 * Only returns connections with syncStatus IDLE or ERROR (not SYNCING).
 *
 * @param cutoffTime - Connections with nextSyncAt <= cutoffTime are included
 * @param batchSize  - Max connections to return (default 5)
 */
export async function getConnectionsDueForSync(
  cutoffTime: Date,
  batchSize?: number,
): Promise<BusinessExternalConnection[]> {
  return db.businessExternalConnection.findMany({
    where: {
      status: "ACTIVE",
      syncStatus: { in: ["IDLE", "ERROR"] },
      OR: [
        { nextSyncAt: null },
        { nextSyncAt: { lte: cutoffTime } },
      ],
    },
    orderBy: { nextSyncAt: "asc" }, // oldest due first
    take: batchSize ?? 5,
  });
}

/**
 * Finds connections stuck in SYNCING state — likely due to a crashed worker.
 * Used by health checks and recovery jobs.
 *
 * @param olderThanMinutes - A connection is "stuck" if lastSyncAt < (now - olderThanMinutes)
 */
export async function getStuckSyncingConnections(
  olderThanMinutes: number,
): Promise<BusinessExternalConnection[]> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  return db.businessExternalConnection.findMany({
    where: {
      syncStatus: "SYNCING",
      lastSyncAt: { lt: cutoff },
    },
  });
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Creates a new external connection for a business.
 * The @@unique([businessId, provider]) constraint enforces one connection per
 * business per provider at the database level.
 *
 * Throws if a connection already exists for this businessId + provider pair.
 */
export async function createConnection(
  input: CreateExternalConnectionInput,
): Promise<BusinessExternalConnection> {
  return db.businessExternalConnection.create({
    data: {
      ...input,
      status: "ACTIVE",
      syncStatus: "IDLE",
    },
  });
}

/**
 * Updates fields on an existing connection.
 * Handles token rotation, sync status updates, and display toggle changes.
 */
export async function updateConnection(
  connectionId: string,
  input: UpdateExternalConnectionInput,
): Promise<BusinessExternalConnection> {
  return db.businessExternalConnection.update({
    where: { id: connectionId },
    data: input,
  });
}

/**
 * Sets the connection status to DISCONNECTED and records disconnectedAt.
 * Does NOT delete cached data — cache cleanup is handled separately.
 * The business owner can reconnect later; cached data may still be valid.
 */
export async function disconnectConnection(
  connectionId: string,
): Promise<BusinessExternalConnection> {
  return db.businessExternalConnection.update({
    where: { id: connectionId },
    data: {
      status: "DISCONNECTED",
      disconnectedAt: new Date(),
      syncStatus: "IDLE",
    },
  });
}

/**
 * Records a connection error — sets status=ERROR and stores the error message.
 * The sync worker calls this when an API call fails and cannot be retried.
 */
export async function markConnectionError(
  connectionId: string,
  errorMessage: string,
): Promise<BusinessExternalConnection> {
  return db.businessExternalConnection.update({
    where: { id: connectionId },
    data: {
      status: "ERROR",
      syncStatus: "ERROR",
      lastError: errorMessage,
    },
  });
}

/**
 * Updates the display toggles for a connection.
 * Businesses use this to show/hide the entire Google reviews or photos section.
 * Individual review/photo visibility is controlled on the cache records themselves.
 */
export async function updateDisplayToggles(
  connectionId: string,
  toggles: { showExternalReviews?: boolean; showExternalPhotos?: boolean },
): Promise<BusinessExternalConnection> {
  return db.businessExternalConnection.update({
    where: { id: connectionId },
    data: toggles,
  });
}
