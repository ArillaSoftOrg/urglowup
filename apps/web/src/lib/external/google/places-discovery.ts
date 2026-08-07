import "server-only";

/**
 * Server-side Google Places discovery.
 *
 * This file is SERVER-ONLY. Never import in client components — it reads the
 * Places API key from process.env.
 *
 * POLICY: This module extracts ONLY `place_id` from Google. It requests the
 * `places.id` FieldMask so Google returns nothing else — no displayName,
 * address, phone, rating, review, or photo. No native content is ever read,
 * returned, logged, or persisted. See GOOGLE_PLACES_MAP_PLAN.md Phase 5.
 */
import {
  GOOGLE_PLACES_TEXT_SEARCH_API,
  PLACES_DISCOVERY_TIMEOUT_MS,
} from "@/lib/constants/external";
import {
  calculateBackoffMs,
  canRetry,
  delay,
  isRetryableStatusCode,
} from "@/lib/external/google/rate-limit";

export type PlaceDiscoveryError =
  | "NO_API_KEY"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "TIMEOUT";

export type PlaceDiscoveryResult = {
  ok: boolean;
  placeIds: string[];
  error?: PlaceDiscoveryError;
  dryRun?: boolean;
};

/** Minimal shape of the FieldMask-limited response — only `places[].id` */
type TextSearchResponse = {
  places?: Array<{ id?: string }>;
};

function resolveApiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    null
  );
}

/**
 * Dry-run is ONLY honored outside production. In production a stray
 * GOOGLE_PLACES_DRY_RUN flag must never inject fake place ids into the queue.
 */
function isDryRunEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.GOOGLE_PLACES_DRY_RUN === "true"
  );
}

/** Deterministic synthetic ids for dry-run (no API cost, no real content). */
function dryRunPlaceIds(textQuery: string, pageSize: number): string[] {
  let hash = 0;
  for (let i = 0; i < textQuery.length; i++) {
    hash = (hash * 31 + textQuery.charCodeAt(i)) >>> 0;
  }
  const count = Math.min(pageSize, 5);
  return Array.from({ length: count }, (_, i) => `dryrun-${hash}-${i}`);
}

/**
 * Runs a Google Places Text Search and returns ONLY the discovered place ids.
 * Never returns or logs any native Google content.
 */
export async function discoverGooglePlaceIds(
  textQuery: string,
  pageSize: number
): Promise<PlaceDiscoveryResult> {
  if (isDryRunEnabled()) {
    const placeIds = dryRunPlaceIds(textQuery, pageSize);
    console.log(`[places-discovery] dry-run count=${placeIds.length}`);
    return { ok: true, placeIds, dryRun: true };
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    return { ok: false, placeIds: [], error: "NO_API_KEY" };
  }

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PLACES_DISCOVERY_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(GOOGLE_PLACES_TEXT_SEARCH_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          // FieldMask: Google returns ONLY place ids — no native content,
          // and no nextPageToken is requested (pagination is out of scope).
          "X-Goog-FieldMask": "places.id",
        },
        body: JSON.stringify({
          textQuery,
          // `pageSize` (maxResultCount is deprecated). Single page only.
          pageSize,
          languageCode: "tr",
          regionCode: "TR",
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort && canRetry(attempt)) {
        await delay(calculateBackoffMs(attempt));
        continue;
      }
      return { ok: false, placeIds: [], error: isAbort ? "TIMEOUT" : "UPSTREAM_ERROR" };
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      if (isRetryableStatusCode(res.status) && canRetry(attempt)) {
        await delay(calculateBackoffMs(attempt));
        continue;
      }
      const error: PlaceDiscoveryError =
        res.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR";
      console.log(`[places-discovery] upstream status=${res.status}`);
      return { ok: false, placeIds: [], error };
    }

    let json: TextSearchResponse;
    try {
      json = (await res.json()) as TextSearchResponse;
    } catch {
      return { ok: false, placeIds: [], error: "UPSTREAM_ERROR" };
    }

    // Extract ONLY ids; discard everything else.
    const placeIds = (json.places ?? [])
      .map((p) => p.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    console.log(`[places-discovery] count=${placeIds.length}`);
    return { ok: true, placeIds };
  }
}
