import "server-only";

/**
 * Server-side Google Place coordinate resolution.
 *
 * POLICY: Requests the `id,location` FieldMask so Google returns ONLY the
 * place id and its lat/lng — no displayName, address, phone, website, rating,
 * review, or photo. Coordinates are used ONLY for transient map rendering and
 * are NEVER persisted to the database, Redis, or any store. See Phase 6.
 */
import {
  GOOGLE_PLACES_DETAILS_API,
  PLACES_LOCATION_FIELD_MASK,
  PLACES_LOCATION_TIMEOUT_MS,
} from "@/lib/constants/external";
import {
  calculateBackoffMs,
  canRetry,
  delay,
  isRetryableStatusCode,
} from "@/lib/external/google/rate-limit";

export type PlaceCoords = { lat: number; lng: number };

/** Request-scope cache: placeId → coords | null (miss). Never persisted. */
export type LocationCache = Map<string, PlaceCoords | null>;

/** Minimal shape of the FieldMask-limited response — only id + location. */
type PlaceDetailsResponse = {
  id?: string;
  location?: { latitude?: number; longitude?: number };
};

function resolveApiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    null
  );
}

function isDryRunEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.GOOGLE_PLACES_DRY_RUN === "true"
  );
}

/** Deterministic synthetic coords inside Turkey for dry-run `dryrun-` ids. */
function dryRunCoords(placeId: string): PlaceCoords {
  let hash = 0;
  for (let i = 0; i < placeId.length; i++) {
    hash = (hash * 31 + placeId.charCodeAt(i)) >>> 0;
  }
  // Spread roughly across Turkey's bounding box.
  const lat = 37 + (hash % 500) / 100; // 37.00–41.99
  const lng = 27 + ((hash >> 9) % 1200) / 100; // 27.00–38.99
  return { lat, lng };
}

/**
 * Resolves a single place's coordinates. Returns null on missing key, 404,
 * NOT_FOUND, timeout, or any invalid response — caller silently skips.
 * Never throws. Never persists. Never logs place ids or payloads.
 */
export async function resolveGooglePlaceLocation(
  placeId: string,
  cache?: LocationCache
): Promise<PlaceCoords | null> {
  if (cache && cache.has(placeId)) {
    return cache.get(placeId) ?? null;
  }

  const coords = await resolveUncached(placeId);
  cache?.set(placeId, coords);
  return coords;
}

async function resolveUncached(placeId: string): Promise<PlaceCoords | null> {
  if (isDryRunEnabled() && placeId.startsWith("dryrun-")) {
    return dryRunCoords(placeId);
  }

  const apiKey = resolveApiKey();
  if (!apiKey) return null;

  const url = `${GOOGLE_PLACES_DETAILS_API}/${encodeURIComponent(placeId)}`;

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PLACES_LOCATION_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": PLACES_LOCATION_FIELD_MASK,
        },
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort && canRetry(attempt)) {
        await delay(calculateBackoffMs(attempt));
        continue;
      }
      return null; // timeout or network error → skip
    } finally {
      clearTimeout(timeout);
    }

    // 404 / NOT_FOUND / invalid place id → not retryable, silent skip.
    if (res.status === 404) return null;

    if (!res.ok) {
      if (isRetryableStatusCode(res.status) && canRetry(attempt)) {
        await delay(calculateBackoffMs(attempt));
        continue;
      }
      return null;
    }

    let json: PlaceDetailsResponse;
    try {
      json = (await res.json()) as PlaceDetailsResponse;
    } catch {
      return null;
    }

    const lat = json.location?.latitude;
    const lng = json.location?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return null;

    return { lat, lng };
  }
}
