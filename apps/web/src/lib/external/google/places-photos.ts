import "server-only";

import {
  GOOGLE_PLACES_DETAILS_API,
  PLACES_LOCATION_TIMEOUT_MS,
} from "@/lib/constants/external";
import {
  GOOGLE_PLACE_PHOTO_PREVIEW_LIMIT,
  normalizeGooglePlacePhotoPreview,
  selectGooglePlacePhotoCandidates,
  type GooglePlacePhotoPreview,
  type GooglePlacePhotoRaw,
} from "./places-photos-normalizer";

type GooglePlacePhotoDetailsResponse = {
  photos?: GooglePlacePhotoRaw[];
};

type GooglePlacePhotoMediaResponse = {
  photoUri?: string;
};

function resolvePlacesApiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    null
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLACES_LOCATION_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPhotoUri(photoName: string, apiKey: string): Promise<string | undefined> {
  const url = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  url.searchParams.set("maxWidthPx", "1600");
  url.searchParams.set("maxHeightPx", "1200");
  url.searchParams.set("skipHttpRedirect", "true");
  url.searchParams.set("key", apiKey);

  const media = await fetchJson<GooglePlacePhotoMediaResponse>(url.toString());
  return typeof media?.photoUri === "string" ? media.photoUri : undefined;
}

/**
 * Fetches transient Google Places photo previews for an admin-only decision aid.
 * Photo resource names and short-lived media URLs are never persisted or cached.
 */
export async function fetchGooglePlacePhotoPreviews(
  placeId: string,
  limit = GOOGLE_PLACE_PHOTO_PREVIEW_LIMIT,
): Promise<GooglePlacePhotoPreview[]> {
  const apiKey = resolvePlacesApiKey();
  if (!apiKey || !placeId.trim()) return [];

  const detailsUrl = `${GOOGLE_PLACES_DETAILS_API}/${encodeURIComponent(placeId)}`;
  const details = await fetchJson<GooglePlacePhotoDetailsResponse>(detailsUrl, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "photos",
    },
  });
  if (!details) return [];

  const photos = selectGooglePlacePhotoCandidates(details.photos ?? [], limit);

  const previews: GooglePlacePhotoPreview[] = [];
  for (let start = 0; start < photos.length; start += 3) {
    const batch = photos.slice(start, start + 3);
    const mediaUrls = await Promise.all(
      batch.map((photo) => fetchPhotoUri(photo.name!, apiKey)),
    );

    batch.forEach((photo, index) => {
      const preview = normalizeGooglePlacePhotoPreview(
        photo,
        mediaUrls[index],
        start + index,
      );
      if (preview) previews.push(preview);
    });
  }

  return previews;
}

export type { GooglePlacePhotoPreview } from "./places-photos-normalizer";
