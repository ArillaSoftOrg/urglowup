export const GOOGLE_PLACE_PHOTO_PREVIEW_LIMIT = 6;

export type GooglePlacePhotoAuthorAttribution = {
  displayName: string | null;
  uri: string | null;
  photoUri: string | null;
};

export type GooglePlacePhotoPreview = {
  id: string;
  previewUrl: string;
  width: number | null;
  height: number | null;
  authorAttributions: GooglePlacePhotoAuthorAttribution[];
  googleMapsUri: string | null;
  flagContentUri: string | null;
};

export type GooglePlacePhotoRaw = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: Array<{
    displayName?: string;
    uri?: string;
    photoUri?: string;
  }>;
  googleMapsUri?: string;
  flagContentUri?: string;
};

function safeHttpsUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function positiveInteger(value: number | undefined): number | null {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null;
}

export function isValidGooglePhotoResourceName(value: string | undefined): value is string {
  return Boolean(value && /^places\/[^/]+\/photos\/[^/]+$/.test(value));
}

export function selectGooglePlacePhotoCandidates(
  photos: GooglePlacePhotoRaw[],
  limit = GOOGLE_PLACE_PHOTO_PREVIEW_LIMIT,
): GooglePlacePhotoRaw[] {
  return photos
    .filter((photo) => isValidGooglePhotoResourceName(photo.name))
    .slice(0, Math.min(Math.max(limit, 0), GOOGLE_PLACE_PHOTO_PREVIEW_LIMIT));
}

export function normalizeGooglePlacePhotoPreview(
  photo: GooglePlacePhotoRaw,
  previewUrl: string | undefined,
  index: number,
): GooglePlacePhotoPreview | null {
  const safePreviewUrl = safeHttpsUrl(previewUrl);
  const googleMapsUri = safeHttpsUrl(photo.googleMapsUri);
  if (
    !safePreviewUrl ||
    !googleMapsUri ||
    !isValidGooglePhotoResourceName(photo.name)
  ) {
    return null;
  }

  return {
    id: `google-place-photo-${index}`,
    previewUrl: safePreviewUrl,
    width: positiveInteger(photo.widthPx),
    height: positiveInteger(photo.heightPx),
    authorAttributions: (photo.authorAttributions ?? []).map((author) => ({
      displayName: author.displayName?.trim() || null,
      uri: safeHttpsUrl(author.uri),
      photoUri: safeHttpsUrl(author.photoUri),
    })),
    googleMapsUri,
    flagContentUri: safeHttpsUrl(photo.flagContentUri),
  };
}
