import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

export type MapPlace = {
  id: string;
  source: "INTERNAL" | "GOOGLE";
  name: string;
  latitude: number;
  longitude: number;
  isBookable: boolean;
  markerVariant: "bookable" | "external";
  profileUrl?: string;
  googleMapsUri?: string;
  claimUrl?: string;
  rating?: number;
  reviewCount?: number;
  coverImageUrl?: string;
  categoryName?: string;
  attribution?: "Google Maps";
  // Phase 6 — external operational fields (no Google native content):
  placeReferenceId?: string;
  providerPlaceId?: string;
  categoryHint?: string;
  city?: string;
  district?: string;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export function isPointInBounds(
  latitude: number,
  longitude: number,
  bounds: MapBounds,
): boolean {
  const withinLatitude = latitude >= bounds.south && latitude <= bounds.north;
  const withinLongitude =
    bounds.west <= bounds.east
      ? longitude >= bounds.west && longitude <= bounds.east
      : longitude >= bounds.west || longitude <= bounds.east;

  return withinLatitude && withinLongitude;
}

export function normalizeBusinessToMapPlace(
  b: MarketplaceBusiness & { latitude: number; longitude: number },
  locale?: string,
): MapPlace {
  const prefix = locale && locale !== "tr" ? `/${locale}` : "";
  return {
    id: b.id,
    source: "INTERNAL",
    name: b.name,
    latitude: b.latitude,
    longitude: b.longitude,
    isBookable: true,
    markerVariant: "bookable",
    profileUrl: `${prefix}/b/${b.slug}`,
    rating: b.reviewAvg ?? undefined,
    reviewCount: b.reviewCount,
    coverImageUrl: b.coverImageUrl ?? undefined,
    categoryName: b.categories[0]?.category.name,
    city: b.city ?? undefined,
    district: b.district ?? undefined,
  };
}

/**
 * Builds a Google Maps deep link for an external place. Client-safe, pure.
 * Returns undefined when there is no providerPlaceId (no link is shown).
 */
export function buildGoogleMapsPlaceUrl(
  providerPlaceId: string | null | undefined,
  label: string,
): string | undefined {
  if (!providerPlaceId) return undefined;
  const q = encodeURIComponent(label || "işletme");
  const pid = encodeURIComponent(providerPlaceId);
  return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${pid}`;
}

/**
 * Normalizes an APPROVED + unclaimed PlaceReference (+ request-time coords)
 * into an external, non-bookable MapPlace. Pure/client-safe.
 *
 * POLICY: uses ONLY our operational labels (categoryHint/city/district).
 * Never uses Google displayName/address/phone/rating/review/photo, and never
 * sets rating/reviewCount.
 */
export function normalizePlaceReferenceToMapPlace(
  ref: {
    id: string;
    providerPlaceId: string;
    city: string | null;
    district: string | null;
    categoryHint: string | null;
  },
  coords: { lat: number; lng: number },
): MapPlace {
  const label = ref.categoryHint ?? "Google Maps işletmesi";
  return {
    id: `ext-${ref.id}`,
    source: "GOOGLE",
    name: label,
    latitude: coords.lat,
    longitude: coords.lng,
    isBookable: false,
    markerVariant: "external",
    profileUrl: undefined,
    googleMapsUri: buildGoogleMapsPlaceUrl(ref.providerPlaceId, label),
    claimUrl: `/claim-business?placeReferenceId=${encodeURIComponent(ref.id)}`,
    placeReferenceId: ref.id,
    providerPlaceId: ref.providerPlaceId,
    categoryHint: ref.categoryHint ?? undefined,
    city: ref.city ?? undefined,
    district: ref.district ?? undefined,
    attribution: "Google Maps",
  };
}
