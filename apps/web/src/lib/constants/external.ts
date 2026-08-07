// ── Cache TTL ─────────────────────────────────────────────────────────────────

/** How long (in days) fetched external data is considered fresh */
export const EXTERNAL_CACHE_TTL_DAYS = 30;

/** Derived TTL in milliseconds — use for Date arithmetic */
export const EXTERNAL_CACHE_TTL_MS =
  EXTERNAL_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * How many days before expiresAt we should proactively schedule a re-fetch.
 * Prevents stale cache gaps: re-fetch is triggered at (expiresAt - 3 days).
 */
export const EXTERNAL_CACHE_REFRESH_BUFFER_DAYS = 3;

// ── Cache cleanup ─────────────────────────────────────────────────────────────

/** Max rows deleted per cleanup batch — prevents long-running transactions */
export const CACHE_CLEANUP_BATCH_SIZE = 500;

/** Header name used to authenticate internal API routes */
export const INTERNAL_SECRET_HEADER = "x-internal-secret";

// ── Google Business Profile API ───────────────────────────────────────────────

export const GOOGLE_MY_BUSINESS_ACCOUNT_MGMT_API =
  "https://mybusinessaccountmanagement.googleapis.com/v1";
export const GOOGLE_MY_BUSINESS_INFO_API =
  "https://mybusinessinformation.googleapis.com/v1";
export const GOOGLE_MY_BUSINESS_REVIEWS_API =
  "https://mybusiness.googleapis.com/v4";

/** Max reviews to request per sync call */
export const GOOGLE_MAX_REVIEWS_PER_FETCH = 50;

/** Max photos to request per sync call */
export const GOOGLE_MAX_PHOTOS_PER_FETCH = 20;

// ── Google Places discovery (Phase 5) ─────────────────────────────────────────

/** Places API (New) Text Search endpoint — server-side discovery only */
export const GOOGLE_PLACES_TEXT_SEARCH_API =
  "https://places.googleapis.com/v1/places:searchText";

/** Hard cap on results per discovery run (single page; New API page limit) */
export const PLACES_DISCOVERY_MAX_RESULTS = 20;

/** Per-request timeout for a discovery call */
export const PLACES_DISCOVERY_TIMEOUT_MS = 8_000;

/** Max businesses checked for a missing Google Place ID per cron run */
export const GOOGLE_PLACE_BACKFILL_BATCH_SIZE = 10;

/** Ambiguous/not-found matches are retried after this many days */
export const GOOGLE_PLACE_MATCH_RETRY_DAYS = 7;

// ── Google Places location (Phase 6) ──────────────────────────────────────────

/** Places API (New) Place Details base — server-side coordinate resolution only */
export const GOOGLE_PLACES_DETAILS_API = "https://places.googleapis.com/v1/places";

/** FieldMask for Place Details: id + coordinate ONLY — no native content */
export const PLACES_LOCATION_FIELD_MASK = "id,location";

/** Hard cap on external (Google) markers resolved per map request */
export const MAX_EXTERNAL_MAP_MARKERS = 20;

/** Max concurrent Place Details calls while resolving external markers */
export const EXTERNAL_LOCATION_CONCURRENCY = 3;

/** Per-request timeout for a Place Details coordinate lookup */
export const PLACES_LOCATION_TIMEOUT_MS = 6_000;

// ── Rate limits ───────────────────────────────────────────────────────────────

/** Conservative requests-per-minute ceiling (adjust after testing) */
export const GOOGLE_API_REQUESTS_PER_MINUTE = 60;

/** Daily request ceiling aligned with Google Business Profile API quotas */
export const GOOGLE_API_REQUESTS_PER_DAY = 1_000;

// ── Retry / backoff ───────────────────────────────────────────────────────────

export const MAX_RETRY_ATTEMPTS = 4;
export const BACKOFF_BASE_MS = 1_000;
export const BACKOFF_MAX_MS = 30_000;

// ── Provider display labels ───────────────────────────────────────────────────

export const EXTERNAL_PROVIDER_LABELS: Record<string, string> = {
  GOOGLE_BUSINESS_PROFILE: "Google Business Profile",
};

/** Short attribution label shown next to Google-sourced content in the UI */
export const GOOGLE_ATTRIBUTION_LABEL = "Google";

/** Full attribution text for legal/compliance display */
export const GOOGLE_ATTRIBUTION_FULL =
  "Reviews and photos from Google Business Profile. " +
  "Displayed in accordance with Google's attribution requirements. " +
  "Not used for platform ranking or AI training.";

// ── Connection status display ─────────────────────────────────────────────────

export const CONNECTION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  EXPIRED: "Token Süresi Doldu",
  DISCONNECTED: "Bağlantı Kesildi",
  ERROR: "Hata",
};

export const CONNECTION_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
  DISCONNECTED: "bg-gray-100 text-gray-800",
  ERROR: "bg-red-100 text-red-800",
};

// ── Sync status display ───────────────────────────────────────────────────────

export const SYNC_STATUS_LABELS: Record<string, string> = {
  IDLE: "Beklemede",
  SYNCING: "Senkronize Ediliyor",
  ERROR: "Senkronizasyon Hatası",
};

export const SYNC_STATUS_COLORS: Record<string, string> = {
  IDLE: "bg-gray-100 text-gray-800",
  SYNCING: "bg-blue-100 text-blue-800",
  ERROR: "bg-red-100 text-red-800",
};

// ── Sync scheduling ───────────────────────────────────────────────────────────

/** How many hours between automatic syncs per connection */
export const SYNC_INTERVAL_HOURS = 24;
export const SYNC_INTERVAL_MS = SYNC_INTERVAL_HOURS * 60 * 60 * 1000;

/** Retry delay after a failed sync */
export const SYNC_RETRY_INTERVAL_HOURS = 2;
export const SYNC_RETRY_INTERVAL_MS = SYNC_RETRY_INTERVAL_HOURS * 60 * 60 * 1000;

/**
 * Minimum gap between manual syncs triggered by a business owner.
 * 6-hour cooldown checked against lastSyncAt.
 * "Max 1 manual sync per 24h" tracking deferred to a later phase.
 */
export const MANUAL_SYNC_COOLDOWN_HOURS = 6;
export const MANUAL_SYNC_COOLDOWN_MS = MANUAL_SYNC_COOLDOWN_HOURS * 60 * 60 * 1000;

/** Refresh access token this many ms before it expires */
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/** A connection stuck in SYNCING for longer than this is considered crashed */
export const SYNC_STUCK_THRESHOLD_MINUTES = 30;

/**
 * Max connections processed per cron invocation.
 * Cron runs every 15 minutes; small batches spread work across the day.
 */
export const SYNC_BATCH_SIZE = 5;
