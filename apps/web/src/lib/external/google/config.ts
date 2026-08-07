/**
 * Google OAuth configuration builder for the Business Profile integration.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import type { GoogleOAuthConfig } from "./oauth";

/** Extended config that also carries the OAuth scopes for building the consent URL */
export interface GoogleConfig extends GoogleOAuthConfig {
  scopes: string[];
}

/**
 * Reads and validates Google OAuth env vars.
 * Throws a descriptive error if any required variable is missing.
 */
export function getGoogleConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scopesRaw =
    process.env.GOOGLE_BUSINESS_PROFILE_SCOPES ??
    "https://www.googleapis.com/auth/business.manage";

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "[google/config] Google OAuth is not configured. " +
        "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: scopesRaw.split(/\s+/).filter(Boolean),
  };
}

/**
 * Builds the Google OAuth 2.0 authorization URL.
 *
 * @param config - OAuth credentials + scopes
 * @param state  - CSRF nonce echoed back in the callback
 */
export function buildGoogleAuthUrl(config: GoogleConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
