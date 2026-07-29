import type { NextRequest } from "next/server";
import { MAX_EXTERNAL_MAP_MARKERS } from "@/lib/constants/external";
import { isValidLocale } from "@/lib/i18n-config";
import { getExternalMapPlaces } from "@/lib/marketplace/external-map-places";
import {
  normalizeBusinessToMapPlace,
  type MapBounds,
} from "@/lib/marketplace/map-place";
import {
  getMarketplaceBusinesses,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";

const INTERNAL_MAP_LIMIT = 200;

function parseCoordinate(
  searchParams: URLSearchParams,
  key: keyof MapBounds,
): number | null {
  const raw = searchParams.get(key);
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseMapBounds(searchParams: URLSearchParams): MapBounds | null {
  const north = parseCoordinate(searchParams, "north");
  const south = parseCoordinate(searchParams, "south");
  const east = parseCoordinate(searchParams, "east");
  const west = parseCoordinate(searchParams, "west");

  if (north === null || south === null || east === null || west === null) {
    return null;
  }
  if (
    north <= south ||
    north > 90 ||
    south < -90 ||
    east < -180 ||
    east > 180 ||
    west < -180 ||
    west > 180
  ) {
    return null;
  }

  return { north, south, east, west };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bounds = parseMapBounds(searchParams);

  if (!bounds) {
    return Response.json(
      { error: "Geçerli bir harita alanı belirtilmedi." },
      { status: 400 },
    );
  }

  const rawFilters = Object.fromEntries(searchParams.entries());
  const filters = parseMarketplaceFilters(rawFilters);
  const requestedLocale = searchParams.get("locale") ?? "tr";
  const locale = isValidLocale(requestedLocale) ? requestedLocale : "tr";

  const businesses = await getMarketplaceBusinesses({
    ...filters,
    bounds,
    limit: INTERNAL_MAP_LIMIT,
  });

  const internalPlaces = businesses
    .filter(
      (
        business,
      ): business is typeof business & {
        latitude: number;
        longitude: number;
      } => business.latitude !== null && business.longitude !== null,
    )
    .map((business) => normalizeBusinessToMapPlace(business, locale));

  const externalPlaces = await getExternalMapPlaces(filters, bounds);
  const places = [...internalPlaces, ...externalPlaces];

  return Response.json(
    {
      places,
      counts: {
        total: places.length,
        bookable: internalPlaces.length,
        external: externalPlaces.length,
      },
      truncated:
        internalPlaces.length >= INTERNAL_MAP_LIMIT ||
        externalPlaces.length >= MAX_EXTERNAL_MAP_MARKERS,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
