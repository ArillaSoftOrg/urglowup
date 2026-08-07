// Duplicated from apps/web/src/lib/constants/external.ts — that file is
// shared by ~25 other Google-integration files not part of this domain
// (sync workers, admin actions, API routes), so moving it wholesale was out
// of scope. Only the handful of constants this module actually needs are
// kept here; keep in sync by hand if the source values change.

/** Max reviews to request per sync call */
export const GOOGLE_MAX_REVIEWS_PER_FETCH = 50;

/** Places API (New) Text Search endpoint — server-side discovery only */
export const GOOGLE_PLACES_TEXT_SEARCH_API =
  "https://places.googleapis.com/v1/places:searchText";

/** Per-request timeout for a discovery call */
export const PLACES_DISCOVERY_TIMEOUT_MS = 8_000;

/** Max businesses checked for a missing Google Place ID per cron run */
export const GOOGLE_PLACE_BACKFILL_BATCH_SIZE = 10;

/** Ambiguous/not-found matches are retried after this many days */
export const GOOGLE_PLACE_MATCH_RETRY_DAYS = 7;

/** Places API (New) Place Details base — server-side coordinate resolution only */
export const GOOGLE_PLACES_DETAILS_API = "https://places.googleapis.com/v1/places";
