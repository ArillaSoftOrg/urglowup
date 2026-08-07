/** All cookie categories used by the application. */
export type CookieCategory = "necessary" | "preference" | "analytics" | "marketing";

/** A single cookie entry in the registry. */
export interface CookieRecord {
  name: string;
  category: CookieCategory;
  purpose: string;
  duration: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax" | "Strict" | "None";
  firstParty: boolean;
}

/**
 * Single source of truth for every cookie UrGlowUp sets.
 * This registry is imported by the cookie policy page so the table
 * always reflects actual implementation.
 */
export const COOKIE_REGISTRY: CookieRecord[] = [
  {
    name: "urglowup.session_token",
    category: "necessary",
    purpose: "Authenticates your login session and keeps you signed in.",
    duration: "30 days",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    firstParty: true,
  },
  {
    name: "ugl_cookie_consent",
    category: "necessary",
    purpose:
      "Stores your cookie consent choice so we do not show the banner again for 180 days.",
    duration: "180 days",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
    firstParty: true,
  },
  {
    name: "ugl_theme",
    category: "preference",
    purpose:
      "Remembers your dark / light / system theme preference across visits.",
    duration: "1 year",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
    firstParty: true,
  },
  {
    name: "NEXT_LOCALE",
    category: "preference",
    purpose:
      "Remembers your language selection (Turkish, English, German, etc.).",
    duration: "1 year",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
    firstParty: true,
  },
  {
    name: "google_oauth_state",
    category: "necessary",
    purpose:
      "Short-lived CSRF token that secures the Google sign-in flow. Deleted after use.",
    duration: "10 minutes",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    firstParty: true,
  },
  {
    name: "google_oauth_pending",
    category: "necessary",
    purpose:
      "Temporarily stores encrypted OAuth tokens during Google Calendar setup. Deleted immediately after use.",
    duration: "15 minutes",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    firstParty: true,
  },
];

/** Human-readable label for each category (English). */
export const CATEGORY_LABELS: Record<CookieCategory, string> = {
  necessary: "Strictly Necessary",
  preference: "Preference",
  analytics: "Analytics",
  marketing: "Marketing",
};
