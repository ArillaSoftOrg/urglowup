/**
 * Core sync orchestrator for a single Google Business Profile connection.
 *
 * Responsibilities:
 *   - Decrypt and refresh the access token as needed
 *   - Fetch and upsert Google reviews → ExternalReviewCache
 *   - Fetch and upsert Google photos → ExternalMediaCache
 *   - Maintain connection/sync status throughout the sync lifecycle
 *
 * Hard rules (NEVER relax):
 *   - Google reviews are NEVER written to the native Review table
 *   - Google photos are NEVER written to BusinessMedia or uploaded to Cloudinary
 *   - Google rating is NEVER merged with UrGlowUp rating
 *   - Plaintext tokens exist only as local variables — never logged, serialized, or returned
 *   - Error messages stored in lastError are safe strings only — no raw API bodies, no tokens
 */
import {
  SYNC_INTERVAL_MS,
  SYNC_RETRY_INTERVAL_MS,
  TOKEN_REFRESH_BUFFER_MS,
} from "@/lib/constants/external";
import { updateConnection } from "@/lib/external/connection-service";
import {
  upsertCachedReviews,
  type UpsertReviewInput,
} from "@/lib/external/review-cache-service";
import {
  upsertCachedPhotos,
  type UpsertPhotoInput,
} from "@/lib/external/media-cache-service";
import { decryptTokenWithEnvKey, encryptTokenWithEnvKey } from "./encryption";
import { refreshAccessToken, TokenRefreshError } from "./oauth";
import {
  fetchGoogleReviews,
  fetchGoogleMediaItems,
  GoogleApiError,
} from "./api-client";
import { normalizeReview, normalizePhoto } from "./normalizers";
import { checkRateLimit } from "./rate-limit";
import { db } from "@/lib/db";

// ── Return type ───────────────────────────────────────────────────────────────

export interface SyncResult {
  connectionId: string;
  reviewsSynced: number;
  photosSynced: number;
  photosSkipped: number; // skipped due to policy guard failures
  errors: string[]; // safe strings only — no tokens, no raw API responses
  durationMs: number;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Fetches, normalizes, and upserts Google reviews for a connection.
 * Returns synced count and any error encountered.
 */
async function doReviewSync(
  accessToken: string,
  accountId: string,
  locationId: string,
  businessId: string,
  connectionId: string,
): Promise<{ synced: number; error?: { status?: number; message: string } }> {
  try {
    // Check rate limit before API call
    const rateLimitCheck = await checkRateLimit(businessId);
    if (!rateLimitCheck.allowed) {
      const retryAfterSec = Math.ceil((rateLimitCheck.retryAfterMs ?? 0) / 1000);
      return {
        synced: 0,
        error: {
          message: `Rate limited: retry in ${retryAfterSec}s`,
        },
      };
    }

    const raw = await fetchGoogleReviews(accessToken, accountId, locationId);
    const reviews = raw.reviews ?? [];
    // nextPageToken is present but ignored in MVP — multi-page support deferred

    const inputs: UpsertReviewInput[] = [];
    for (const rawReview of reviews) {
      const normalized = normalizeReview(rawReview);
      if (!normalized) {
        // STAR_RATING_UNSPECIFIED — skip
        console.warn("[sync] skipping review with unspecified star rating", {
          providerReviewId: rawReview.reviewId,
          connectionId,
        });
        continue;
      }
      inputs.push({
        ...normalized,
        businessId,
        connectionId,
        provider: "GOOGLE_BUSINESS_PROFILE",
      });
    }

    const synced = await upsertCachedReviews(inputs);
    return { synced };
  } catch (err) {
    if (err instanceof GoogleApiError) {
      return { synced: 0, error: { status: err.status, message: err.message } };
    }
    return {
      synced: 0,
      error: { message: err instanceof Error ? err.message : "Unknown error" },
    };
  }
}

/**
 * Fetches, normalizes, and upserts Google photos for a connection.
 * Returns synced count, skipped count, and any error encountered.
 */
async function doPhotoSync(
  accessToken: string,
  accountId: string,
  locationId: string,
  businessId: string,
  connectionId: string,
): Promise<{
  synced: number;
  skipped: number;
  error?: { status?: number; message: string };
}> {
  try {
    // Check rate limit before API call
    const rateLimitCheck = await checkRateLimit(businessId);
    if (!rateLimitCheck.allowed) {
      const retryAfterSec = Math.ceil((rateLimitCheck.retryAfterMs ?? 0) / 1000);
      return {
        synced: 0,
        skipped: 0,
        error: {
          message: `Rate limited: retry in ${retryAfterSec}s`,
        },
      };
    }

    const raw = await fetchGoogleMediaItems(accessToken, accountId, locationId);
    const items = raw.mediaItems ?? [];
    // nextPageToken is present but ignored in MVP — multi-page support deferred

    const validInputs: UpsertPhotoInput[] = [];
    let skipped = 0;

    for (const rawItem of items) {
      const normalized = normalizePhoto(rawItem);
      if (!normalized) {
        // Policy violation or unspecified format — already logged in normalizePhoto
        skipped++;
        continue;
      }
      validInputs.push({
        ...normalized,
        businessId,
        connectionId,
        provider: "GOOGLE_BUSINESS_PROFILE",
      });
    }

    const synced = await upsertCachedPhotos(validInputs);
    return { synced, skipped };
  } catch (err) {
    if (err instanceof GoogleApiError) {
      return {
        synced: 0,
        skipped: 0,
        error: { status: err.status, message: err.message },
      };
    }
    return {
      synced: 0,
      skipped: 0,
      error: { message: err instanceof Error ? err.message : "Unknown error" },
    };
  }
}

// ── Main sync entry point ─────────────────────────────────────────────────────

/**
 * Syncs Google reviews and photos for a single connection.
 *
 * Sequence:
 *   1. Load connection by ID; guard checks (ACTIVE, not SYNCING, has locationId)
 *   2. Mark syncStatus=SYNCING
 *   3. Decrypt access token (plaintext lives only in this function scope)
 *   4. Refresh token if within TOKEN_REFRESH_BUFFER_MS of expiry
 *   5. Fetch and upsert reviews (errors logged; 401/403 aborts photo step)
 *   6. Fetch and upsert photos (independent unless token was invalidated)
 *   7. Mark syncStatus=IDLE and update nextSyncAt on full success
 *   8. On hard errors (401/403, invalid_grant), escalate connection status to EXPIRED/ERROR
 */
export async function syncConnection(connectionId: string): Promise<SyncResult> {
  const startMs = Date.now();
  const errors: string[] = [];
  let reviewsSynced = 0;
  let photosSynced = 0;
  let photosSkipped = 0;

  // 1. Load connection by ID
  const connection = await db.businessExternalConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return {
      connectionId,
      reviewsSynced: 0,
      photosSynced: 0,
      photosSkipped: 0,
      errors: ["Connection not found"],
      durationMs: Date.now() - startMs,
    };
  }

  // Guard: only sync ACTIVE connections
  if (connection.status !== "ACTIVE") {
    return {
      connectionId,
      reviewsSynced: 0,
      photosSynced: 0,
      photosSkipped: 0,
      errors: [],
      durationMs: Date.now() - startMs,
    };
  }

  // Guard: skip if another worker is already running
  if (connection.syncStatus === "SYNCING") {
    return {
      connectionId,
      reviewsSynced: 0,
      photosSynced: 0,
      photosSkipped: 0,
      errors: [],
      durationMs: Date.now() - startMs,
    };
  }

  // Guard: must have a location selected
  if (!connection.providerLocationId) {
    await updateConnection(connectionId, {
      syncStatus: "ERROR",
      lastError: "No location selected — visit Integrations to select",
      nextSyncAt: new Date(Date.now() + SYNC_INTERVAL_MS),
    });
    return {
      connectionId,
      reviewsSynced: 0,
      photosSynced: 0,
      photosSkipped: 0,
      errors: ["No location selected"],
      durationMs: Date.now() - startMs,
    };
  }

  // 2. Mark sync start
  await updateConnection(connectionId, {
    syncStatus: "SYNCING",
    lastSyncAt: new Date(),
  });

  // 3. Decrypt access token — plaintext lives only in this scope, never logged
  if (!connection.accessTokenEncrypted) {
    await updateConnection(connectionId, {
      syncStatus: "ERROR",
      lastError: "No access token — please reconnect Google Business Profile",
      nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
    });
    return {
      connectionId,
      reviewsSynced: 0,
      photosSynced: 0,
      photosSkipped: 0,
      errors: ["No access token"],
      durationMs: Date.now() - startMs,
    };
  }

  let accessToken: string;
  try {
    accessToken = decryptTokenWithEnvKey(connection.accessTokenEncrypted);
  } catch {
    await updateConnection(connectionId, {
      syncStatus: "ERROR",
      lastError: "Token decryption failed",
      nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
    });
    return {
      connectionId,
      reviewsSynced: 0,
      photosSynced: 0,
      photosSkipped: 0,
      errors: ["Token decryption failed"],
      durationMs: Date.now() - startMs,
    };
  }

  // 4. Token refresh check
  const needsRefresh =
    connection.tokenExpiresAt !== null &&
    connection.tokenExpiresAt.getTime() < Date.now() + TOKEN_REFRESH_BUFFER_MS;

  if (needsRefresh && connection.refreshTokenEncrypted) {
    let refreshTokenPlaintext: string;
    try {
      refreshTokenPlaintext = decryptTokenWithEnvKey(
        connection.refreshTokenEncrypted,
      );
    } catch {
      await updateConnection(connectionId, {
        syncStatus: "ERROR",
        lastError: "Token decryption failed",
        nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
      });
      return {
        connectionId,
        reviewsSynced: 0,
        photosSynced: 0,
        photosSkipped: 0,
        errors: ["Refresh token decryption failed"],
        durationMs: Date.now() - startMs,
      };
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
      await updateConnection(connectionId, {
        syncStatus: "ERROR",
        lastError: "Google OAuth not configured",
        nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
      });
      return {
        connectionId,
        reviewsSynced: 0,
        photosSynced: 0,
        photosSkipped: 0,
        errors: ["Google OAuth not configured"],
        durationMs: Date.now() - startMs,
      };
    }

    try {
      const refreshed = await refreshAccessToken(
        {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          redirectUri: googleRedirectUri,
        },
        refreshTokenPlaintext,
      );

      // Encrypt and persist the new token; use new plaintext for this run
      const newEncrypted = encryptTokenWithEnvKey(refreshed.access_token);
      await updateConnection(connectionId, {
        accessTokenEncrypted: newEncrypted,
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      });
      accessToken = refreshed.access_token;
    } catch (err) {
      if (err instanceof TokenRefreshError && err.code === "invalid_grant") {
        await updateConnection(connectionId, {
          status: "EXPIRED",
          syncStatus: "ERROR",
          lastError: "Token expired — please reconnect Google Business Profile",
          nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
        });
        return {
          connectionId,
          reviewsSynced: 0,
          photosSynced: 0,
          photosSkipped: 0,
          errors: ["Token expired — reconnect required"],
          durationMs: Date.now() - startMs,
        };
      }

      await updateConnection(connectionId, {
        syncStatus: "ERROR",
        lastError: "Token refresh failed — will retry",
        nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
      });
      return {
        connectionId,
        reviewsSynced: 0,
        photosSynced: 0,
        photosSkipped: 0,
        errors: ["Token refresh failed"],
        durationMs: Date.now() - startMs,
      };
    }
  }

  const { providerAccountId: accountId, providerLocationId: locationId, businessId } =
    connection;

  // Track whether a 401/403 invalidated the token
  let tokenInvalidated = false;

  // 5. Review sync
  const reviewResult = await doReviewSync(
    accessToken,
    accountId,
    locationId,
    businessId,
    connectionId,
  );
  reviewsSynced = reviewResult.synced;

  if (reviewResult.error) {
    const { status, message } = reviewResult.error;
    errors.push(`Reviews: ${message}`);

    if (status === 401) {
      await updateConnection(connectionId, {
        status: "EXPIRED",
        syncStatus: "ERROR",
        lastError: "Token expired — reconnect required",
        nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
      });
      tokenInvalidated = true;
    } else if (status === 403) {
      await updateConnection(connectionId, {
        status: "ERROR",
        syncStatus: "ERROR",
        lastError: "Permission denied — check account access",
        nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
      });
      tokenInvalidated = true;
    }
  }

  // 6. Photo sync (independent of review step unless token was invalidated)
  if (!tokenInvalidated) {
    const photoResult = await doPhotoSync(
      accessToken,
      accountId,
      locationId,
      businessId,
      connectionId,
    );
    photosSynced = photoResult.synced;
    photosSkipped = photoResult.skipped;

    if (photoResult.error) {
      const { status, message } = photoResult.error;
      errors.push(`Photos: ${message}`);

      if (status === 401) {
        await updateConnection(connectionId, {
          status: "EXPIRED",
          syncStatus: "ERROR",
          lastError: "Token expired — reconnect required",
          nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
        });
        tokenInvalidated = true;
      } else if (status === 403) {
        await updateConnection(connectionId, {
          status: "ERROR",
          syncStatus: "ERROR",
          lastError: "Permission denied — check account access",
          nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
        });
        tokenInvalidated = true;
      }
    }
  }

  // 7–8. Final status update (only when token is still valid)
  if (!tokenInvalidated) {
    if (errors.length > 0) {
      // Partial failure (e.g. 429 or 5xx) — retry later
      await updateConnection(connectionId, {
        syncStatus: "ERROR",
        lastError: errors[0] ?? "Sync error — will retry",
        nextSyncAt: new Date(Date.now() + SYNC_RETRY_INTERVAL_MS),
      });
    } else {
      // Full success
      await updateConnection(connectionId, {
        syncStatus: "IDLE",
        lastSyncAt: new Date(),
        nextSyncAt: new Date(Date.now() + SYNC_INTERVAL_MS),
        lastError: null,
      });
    }
  }

  return {
    connectionId,
    reviewsSynced,
    photosSynced,
    photosSkipped,
    errors,
    durationMs: Date.now() - startMs,
  };
}
