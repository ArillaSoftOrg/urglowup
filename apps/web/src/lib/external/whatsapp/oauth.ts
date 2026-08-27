/**
 * Meta Graph API OAuth helpers for the WhatsApp Embedded Signup
 * (Coexistence) onboarding flow.
 *
 * Token security rules (mirrors lib/external/google/oauth.ts):
 *   - Plaintext tokens/codes are NEVER logged or returned beyond immediate use.
 *   - Callers must encrypt before persisting — see integration-store.ts.
 *   - This module does not read from or write to the DB.
 *
 * VERIFY BEFORE PRODUCTION: Meta's exact error payload shape for a
 * replayed/expired authorization code (error.type / error.code values) was
 * not verified against a live request while writing this module — the
 * classification below (HTTP 400 → "invalid_grant") is a best-effort read
 * of Meta's documented OAuthException behavior. Confirm against a real
 * Meta response before relying on it to distinguish replay from other
 * failures in production alerting.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import type { WhatsAppOnboardingConfig } from "./onboarding-config";

export class WhatsAppOAuthError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_grant" | "exchange_failed" | "network_error",
  ) {
    super(message);
    this.name = "WhatsAppOAuthError";
  }
}

interface TokenExchangeResult {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

function graphBaseUrl(apiVersion: string): string {
  return `https://graph.facebook.com/${apiVersion}`;
}

/**
 * Exchanges a one-time Embedded Signup authorization code for a short-lived
 * user access token.
 *
 * Meta's /oauth/access_token endpoint takes credentials as query-string
 * parameters on a GET request — unlike Google's token endpoint (POST body).
 * This is intentional and matches Meta's documented Graph API OAuth flow,
 * not an inconsistency with the Google integration.
 *
 * @throws WhatsAppOAuthError("invalid_grant") when the code is expired,
 *         already used (replay), or was issued for a different redirect_uri.
 */
export async function exchangeCodeForShortLivedToken(
  config: WhatsAppOnboardingConfig,
  code: string,
): Promise<TokenExchangeResult> {
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  return requestToken(`${graphBaseUrl(config.apiVersion)}/oauth/access_token?${params.toString()}`);
}

/**
 * Exchanges a short-lived user access token for a long-lived one (Meta
 * documents ~60 days). Embedded Signup's immediately-returned token is
 * short-lived; production sends should use the long-lived token (or a
 * system-user token generated separately in Meta Business Manager) instead.
 */
export async function exchangeForLongLivedToken(
  config: WhatsAppOnboardingConfig,
  shortLivedAccessToken: string,
): Promise<TokenExchangeResult> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLivedAccessToken,
  });

  return requestToken(`${graphBaseUrl(config.apiVersion)}/oauth/access_token?${params.toString()}`);
}

async function requestToken(url: string): Promise<TokenExchangeResult> {
  let response: Response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch {
    throw new WhatsAppOAuthError("Token exchange network request failed", "network_error");
  }

  if (!response.ok) {
    // Read only the structured `error.type`/`error.code` fields for
    // classification — never log the full response body, which could
    // (depending on the failure) echo back request parameters.
    let errorType: string | undefined;
    try {
      const json = (await response.json()) as { error?: { type?: string; code?: number } };
      errorType = json.error?.type;
    } catch {
      // body unreadable — no data to classify with, fall through to generic
    }

    if (response.status === 400) {
      throw new WhatsAppOAuthError(
        errorType
          ? `Authorization code exchange rejected (${errorType})`
          : "Authorization code is invalid, expired, or already used",
        "invalid_grant",
      );
    }

    throw new WhatsAppOAuthError(`Token exchange failed with status ${response.status}`, "exchange_failed");
  }

  let json: { access_token?: string; token_type?: string; expires_in?: number };
  try {
    json = (await response.json()) as typeof json;
  } catch {
    throw new WhatsAppOAuthError("Token exchange response was not valid JSON", "exchange_failed");
  }

  if (!json.access_token) {
    throw new WhatsAppOAuthError("Token exchange response missing access_token", "exchange_failed");
  }

  return { access_token: json.access_token, token_type: json.token_type, expires_in: json.expires_in };
}
