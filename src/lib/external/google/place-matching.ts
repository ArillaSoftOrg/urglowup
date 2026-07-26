import "server-only";

import {
  GOOGLE_PLACES_DETAILS_API,
  GOOGLE_PLACES_TEXT_SEARCH_API,
  PLACES_DISCOVERY_TIMEOUT_MS,
} from "@/lib/constants/external";

const PLACE_MATCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
].join(",");

const PLACE_DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "googleMapsUri",
].join(",");

type GooglePlaceMatchRaw = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
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
  rating: number | null;
  userRatingCount: number;
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

  return {
    placeId,
    name,
    formattedAddress: place.formattedAddress?.trim() || null,
    googleMapsUri: safeHttpsUrl(place.googleMapsUri),
    rating:
      Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null,
    userRatingCount:
      Number.isInteger(userRatingCount) && userRatingCount >= 0
        ? userRatingCount
        : 0,
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
