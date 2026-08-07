/** Builds a Google Maps directions deep link, preferring coordinates when available. */
export function buildDirectionsUrl({
  latitude,
  longitude,
  address,
}: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}): string | null {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return null;
}
