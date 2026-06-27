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
  attribution?: "Google Maps";
};

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
  };
}
