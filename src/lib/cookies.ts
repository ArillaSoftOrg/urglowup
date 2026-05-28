export const COOKIE_CONSENT_NAME = "ugl_cookie_consent";

/** Granular per-category consent preferences (stored in the structured cookie). */
export interface ConsentPrefs {
  analytics: boolean;
  marketing: boolean;
}

/**
 * @deprecated – legacy binary value kept for backwards-compat parsing only.
 * New code should use ConsentPrefs / serializeConsentCookie / parseConsentCookie.
 */
export type CookieConsentValue = "necessary" | "all";

/** 180 days in seconds */
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

// ── Serialise / parse ─────────────────────────────────────────────────────────

/**
 * Serialise structured consent to a compact URL-safe cookie value.
 * Format: `v1:analytics=0,marketing=1`
 */
export function serializeConsentCookie(prefs: ConsentPrefs): string {
  return `v1:analytics=${prefs.analytics ? 1 : 0},marketing=${prefs.marketing ? 1 : 0}`;
}

/**
 * Parse any supported cookie format into ConsentPrefs.
 * Returns `null` when the value is absent or unrecognisable — treat as "no consent yet".
 *
 * Supported formats:
 *  - `v1:analytics=0,marketing=1`  (current)
 *  - `"all"`                        (legacy – maps to analytics+marketing ON)
 *  - `"necessary"`                  (legacy – maps to analytics+marketing OFF)
 */
export function parseConsentCookie(
  value: string | undefined | null,
): ConsentPrefs | null {
  if (!value) return null;
  if (value === "all") return { analytics: true, marketing: true };
  if (value === "necessary") return { analytics: false, marketing: false };

  const match = value.match(/^v1:analytics=([01]),marketing=([01])$/);
  if (match) {
    return {
      analytics: match[1] === "1",
      marketing: match[2] === "1",
    };
  }
  return null;
}

// ── Client helper ─────────────────────────────────────────────────────────────

/** Set a cookie from client-side code (browser only). */
export function setClientCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Read a single cookie value by name from the browser (client only). */
export function getClientCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}
