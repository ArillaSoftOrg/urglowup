import {
  GOOGLE_PLACES_DETAILS_API,
  GOOGLE_PLACES_TEXT_SEARCH_API,
  PLACES_DISCOVERY_TIMEOUT_MS,
} from "./constants";

const PLACE_MATCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.googleMapsUri",
  "places.location",
  "places.rating",
  "places.userRatingCount",
].join(",");

const PLACE_DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "googleMapsUri",
  "location",
].join(",");

type GooglePlaceMatchRaw = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  rating?: number;
  userRatingCount?: number;
};

type GooglePlaceSearchResponse = {
  places?: GooglePlaceMatchRaw[];
};

export type GooglePlaceCandidate = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
  googleMapsUri: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  userRatingCount: number;
};

export type GooglePlaceMatchBusiness = {
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type GooglePlaceCandidateAssessment = {
  candidate: GooglePlaceCandidate;
  isStrongMatch: boolean;
  nameScore: number;
  locationMatches: boolean;
};

export type GooglePlaceMatchError =
  | "NO_API_KEY"
  | "TIMEOUT"
  | "UPSTREAM_ERROR";

export type GooglePlaceMatchResult = {
  ok: boolean;
  candidates: GooglePlaceCandidate[];
  error?: GooglePlaceMatchError;
};

function resolvePlacesApiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    null
  );
}

function safeHttpsUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeCandidate(
  place: GooglePlaceMatchRaw,
): GooglePlaceCandidate | null {
  const placeId = place.id?.trim();
  const name = place.displayName?.text?.trim();
  if (!placeId || !name) return null;

  const rating = Number(place.rating);
  const userRatingCount = Number(place.userRatingCount);
  const latitude = Number(place.location?.latitude);
  const longitude = Number(place.location?.longitude);

  return {
    placeId,
    name,
    formattedAddress: place.formattedAddress?.trim() || null,
    googleMapsUri: safeHttpsUrl(place.googleMapsUri),
    latitude:
      Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
        ? latitude
        : null,
    longitude:
      Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
        ? longitude
        : null,
    rating:
      Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null,
    userRatingCount:
      Number.isInteger(userRatingCount) && userRatingCount >= 0
        ? userRatingCount
        : 0,
  };
}

function normalizeForMatch(value: string | null | undefined): string {
  return (value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replaceAll("ı", "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function calculateNameScore(
  businessName: string,
  candidateName: string,
): number {
  const expected = normalizeForMatch(businessName);
  const actual = normalizeForMatch(candidateName);
  if (!expected || !actual) return 0;
  if (expected === actual) return 100;

  const expectedTokens = expected.split(" ");
  if (
    expected.length >= 8 &&
    expectedTokens.length >= 2 &&
    (actual.startsWith(`${expected} `) || actual.endsWith(` ${expected}`))
  ) {
    return 90;
  }

  return 0;
}

function distanceInMeters(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
): number {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function locationMatches(
  business: GooglePlaceMatchBusiness,
  candidate: GooglePlaceCandidate,
): boolean {
  if (
    business.latitude !== null &&
    business.longitude !== null &&
    candidate.latitude !== null &&
    candidate.longitude !== null
  ) {
    return (
      distanceInMeters(
        {
          latitude: business.latitude,
          longitude: business.longitude,
        },
        {
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        },
      ) <= 750
    );
  }

  const candidateAddress = normalizeForMatch(candidate.formattedAddress);
  if (!candidateAddress) return false;

  const district = normalizeForMatch(business.district);
  const city = normalizeForMatch(business.city);
  if (!district && !city) return false;

  return (
    (!district || candidateAddress.includes(district)) &&
    (!city || candidateAddress.includes(city))
  );
}

export function assessGooglePlaceCandidate(
  business: GooglePlaceMatchBusiness,
  candidate: GooglePlaceCandidate,
): GooglePlaceCandidateAssessment {
  const nameScore = calculateNameScore(business.name, candidate.name);
  const matchesLocation = locationMatches(business, candidate);

  return {
    candidate,
    isStrongMatch: nameScore >= 90 && matchesLocation,
    nameScore,
    locationMatches: matchesLocation,
  };
}

async function placesRequest<T>(
  url: string,
  init: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: GooglePlaceMatchError }> {
  const apiKey = resolvePlacesApiKey();
  if (!apiKey) return { ok: false, error: "NO_API_KEY" };

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    PLACES_DISCOVERY_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        "X-Goog-Api-Key": apiKey,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn("[place-matching] Google Places request failed", {
        status: response.status,
      });
      return { ok: false, error: "UPSTREAM_ERROR" };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.name === "AbortError"
          ? "TIMEOUT"
          : "UPSTREAM_ERROR",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchGooglePlaceCandidates(
  textQuery: string,
): Promise<GooglePlaceMatchResult> {
  const result = await placesRequest<GooglePlaceSearchResponse>(
    GOOGLE_PLACES_TEXT_SEARCH_API,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": PLACE_MATCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery,
        pageSize: 5,
        languageCode: "tr",
        regionCode: "TR",
      }),
    },
  );

  if (!result.ok) {
    return { ok: false, candidates: [], error: result.error };
  }

  return {
    ok: true,
    candidates: (result.data.places ?? [])
      .map(normalizeCandidate)
      .filter((candidate): candidate is GooglePlaceCandidate =>
        Boolean(candidate),
      ),
  };
}

export async function fetchGooglePlaceCandidate(
  placeId: string,
): Promise<GooglePlaceCandidate | null> {
  const result = await placesRequest<GooglePlaceMatchRaw>(
    `${GOOGLE_PLACES_DETAILS_API}/${encodeURIComponent(placeId)}`,
    {
      method: "GET",
      headers: {
        "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
      },
    },
  );

  return result.ok ? normalizeCandidate(result.data) : null;
}
