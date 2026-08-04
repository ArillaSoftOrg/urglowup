import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidGooglePhotoResourceName,
  normalizeGooglePlacePhotoPreview,
  selectGooglePlacePhotoCandidates,
} from "./places-photos-normalizer";

test("normalizes a complete Google photo preview with required attribution links", () => {
  const preview = normalizeGooglePlacePhotoPreview(
    {
      name: "places/example-place/photos/example-photo",
      widthPx: 1600,
      heightPx: 1200,
      authorAttributions: [
        {
          displayName: "Example Author",
          uri: "https://maps.google.com/example-author",
          photoUri: "https://lh3.googleusercontent.com/avatar",
        },
      ],
      googleMapsUri: "https://maps.google.com/example-photo",
      flagContentUri: "https://maps.google.com/flag-photo",
    },
    "https://lh3.googleusercontent.com/example-photo",
    2,
  );

  assert.deepEqual(preview, {
    id: "google-place-photo-2",
    previewUrl: "https://lh3.googleusercontent.com/example-photo",
    width: 1600,
    height: 1200,
    authorAttributions: [
      {
        displayName: "Example Author",
        uri: "https://maps.google.com/example-author",
        photoUri: "https://lh3.googleusercontent.com/avatar",
      },
    ],
    googleMapsUri: "https://maps.google.com/example-photo",
    flagContentUri: "https://maps.google.com/flag-photo",
  });
});

test("keeps a photo with missing attribution while dropping unsafe optional URLs", () => {
  const preview = normalizeGooglePlacePhotoPreview(
    {
      name: "places/example-place/photos/example-photo",
      widthPx: -1,
      heightPx: Number.NaN,
      authorAttributions: [{ displayName: " ", uri: "javascript:alert(1)" }],
      googleMapsUri: "https://maps.google.com/example-photo",
    },
    "https://lh3.googleusercontent.com/example-photo",
    0,
  );

  assert.ok(preview);
  assert.equal(preview.width, null);
  assert.equal(preview.height, null);
  assert.deepEqual(preview.authorAttributions, [
    { displayName: null, uri: null, photoUri: null },
  ]);
  assert.equal(preview.googleMapsUri, "https://maps.google.com/example-photo");
});

test("rejects invalid resource names and non-HTTPS preview URLs", () => {
  assert.equal(isValidGooglePhotoResourceName("photo-reference-only"), false);
  assert.equal(
    normalizeGooglePlacePhotoPreview(
      { name: "photo-reference-only" },
      "https://lh3.googleusercontent.com/example-photo",
      0,
    ),
    null,
  );
  assert.equal(
    normalizeGooglePlacePhotoPreview(
      {
        name: "places/example-place/photos/example-photo",
        googleMapsUri: "https://maps.google.com/example-photo",
      },
      "http://lh3.googleusercontent.com/example-photo",
      0,
    ),
    null,
  );
  assert.equal(
    normalizeGooglePlacePhotoPreview(
      { name: "places/example-place/photos/example-photo" },
      "https://lh3.googleusercontent.com/example-photo",
      0,
    ),
    null,
  );
});

test("caps valid Google photo candidates at six while supporting smaller result sets", () => {
  const photos = Array.from({ length: 8 }, (_, index) => ({
    name: `places/example-place/photos/photo-${index}`,
  }));
  photos.splice(2, 0, { name: "invalid-photo-name" });

  assert.equal(selectGooglePlacePhotoCandidates(photos).length, 6);
  assert.equal(selectGooglePlacePhotoCandidates(photos, 3).length, 3);
  assert.equal(selectGooglePlacePhotoCandidates(photos.slice(0, 1)).length, 1);
  assert.equal(selectGooglePlacePhotoCandidates([]).length, 0);
});
