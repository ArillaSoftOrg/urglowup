import "server-only";

/**
 * Server-only builder for external (Google Places) map markers.
 *
 * Sources APPROVED + unclaimed PlaceReference rows and resolves each place's
 * coordinates at request time (transient, never persisted). Returns MapPlace[]
 * for map rendering only. Never throws — any failure yields [].
 */
import { db } from "@/lib/db";
import {
  MAX_EXTERNAL_MAP_MARKERS,
  EXTERNAL_LOCATION_CONCURRENCY,
} from "@/lib/constants/external";
import {
  resolveGooglePlaceLocation,
  type LocationCache,
} from "@/lib/external/google/places-location";
import {
  isPointInBounds,
  normalizePlaceReferenceToMapPlace,
  type MapBounds,
  type MapPlace,
} from "./map-place";
import type { ParsedFilters } from "@/lib/queries/marketplace";

/** Resolves a list with a bounded concurrency limit, preserving input order. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * Returns external map markers for the given filters.
 *
 * Gating (cost control): external markers are resolved ONLY when a `city`
 * filter is present, and are suppressed when a `categorySlug` or free-text `q`
 * filter is active (categoryHint is free text and does not align with slugs).
 */
export async function getExternalMapPlaces(
  filters: ParsedFilters,
  bounds?: MapBounds,
): Promise<MapPlace[]> {
  try {
    if (!filters.city) return [];
    if (filters.categorySlug || filters.q) return [];

    const refs = await db.placeReference.findMany({
      where: {
        provider: "GOOGLE",
        status: "APPROVED",
        claimedBusinessId: null,
        providerPlaceId: { not: "" },
        city: { equals: filters.city, mode: "insensitive" },
        ...(filters.district && {
          district: { equals: filters.district, mode: "insensitive" },
        }),
      },
      select: {
        id: true,
        providerPlaceId: true,
        city: true,
        district: true,
        categoryHint: true,
      },
      take: MAX_EXTERNAL_MAP_MARKERS,
    });

    if (refs.length === 0) return [];

    const cache: LocationCache = new Map();
    const resolved = await mapWithConcurrency(
      refs,
      EXTERNAL_LOCATION_CONCURRENCY,
      async (ref) => {
        const coords = await resolveGooglePlaceLocation(ref.providerPlaceId, cache);
        return coords ? normalizePlaceReferenceToMapPlace(ref, coords) : null;
      },
    );

    const places = resolved
      .filter((p): p is MapPlace => p !== null)
      .filter(
        (place) =>
          !bounds ||
          isPointInBounds(place.latitude, place.longitude, bounds),
      );
    console.log(
      `[external-map-places] resolved=${places.length} failed=${refs.length - places.length}`,
    );
    return places;
  } catch {
    return [];
  }
}
