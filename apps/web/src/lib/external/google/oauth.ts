/**
 * Google OAuth 2.0 helpers for the Google Business Profile integration.
 *
 * Responsibilities:
 *   - refreshAccessToken: POST to Google's token endpoint to refresh an expired access token
 *
 * Token security rules:
 *   - Plaintext tokens are NEVER stored, logged, or returned to callers beyond immediate use
 *   - All tokens must be encrypted before being written to the DB (see encryption.ts)
 *   - This module does not read from or write to the DB — callers handle persistence
 */

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface TokenExchangeResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

// ── Custom error class ────────────────────────────────────────────────────────

export class TokenRefreshError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_grant"
      | "refresh_failed"
      | "network_error",
  ) {
    super(message);
    this.name = "TokenRefreshError";
  }
}

// ── Token refresh ─────────────────────────────────────────────────────────────

/**
 * Refreshes an expired access token using the stored refresh token.
 *
 * @param config  - OAuth client credentials (never log these)
 * @param refreshTokenPlaintext - Decrypted refresh token (never log this)
 * @returns New access token and its lifetime in seconds
 *
 * @throws TokenRefreshError("invalid_grant") when the refresh token is revoked or expired —
 *         the user must reconnect their Google account
 * @throws TokenRefreshError("refresh_failed") for other 4xx errors from Google
 * @throws TokenRefreshError("network_error") for network failures or unexpected errors
 */
export async function refreshAccessToken(
  config: GoogleOAuthConfig,
  refreshTokenPlaintext: string,
): Promise<{ access_token: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshTokenPlaintext,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    // Network failure — no response body to inspect
    throw new TokenRefreshError(
      "Token refresh network request failed",
      "network_error",
    );
  }

  if (!response.ok) {
    // Parse the error body to detect invalid_grant without leaking sensitive values
    let errorCode: string | undefined;
    try {
      const json = (await response.json()) as { error?: string };
      errorCode = json.error;
    } catch {
      // Body unreadable — treat as generic failure
    }

    if (response.status === 400 && errorCode === "invalid_grant") {
      throw new TokenRefreshError(
        "Refresh token is invalid or has been revoked",
        "invalid_grant",
      );
    }

    throw new TokenRefreshError(
      `Token refresh failed with status ${response.status}`,
      "refresh_failed",
    );
  }

  let json: { access_token?: string; expires_in?: number };
  try {
    json = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
  } catch {
    throw new TokenRefreshError(
      "Token refresh response was not valid JSON",
      "refresh_failed",
    );
  }

  if (!json.access_token || typeof json.expires_in !== "number") {
    throw new TokenRefreshError(
      "Token refresh response missing required fields",
      "refresh_failed",
    );
  }

  return {
    access_token: json.access_token,
    expires_in: json.expires_in,
  };
}

// ── Authorization code exchange ───────────────────────────────────────────────

/**
 * Exchanges a Google authorization code for access and refresh tokens.
 *
 * @param config - OAuth client credentials
 * @param code   - One-time authorization code from the OAuth callback
 * @returns      Access token, refresh token, and token lifetime
 *
 * @throws TokenRefreshError("invalid_grant")  when the code is expired or already used
 * @throws TokenRefreshError("refresh_failed") for other 4xx errors
 * @throws TokenRefreshError("network_error")  for network failures
 */
export async function exchangeCodeForTokens(
  config: GoogleOAuthConfig,
  code: string,
): Promise<TokenExchangeResult> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    throw new TokenRefreshError(
      "Token exchange network request failed",
      "network_error",
    );
  }

  if (!response.ok) {
    let errorCode: string | undefined;
    try {
      const json = (await response.json()) as { error?: string };
      errorCode = json.error;
    } catch {
      // Body unreadable
    }
    if (response.status === 400 && errorCode === "invalid_grant") {
      throw new TokenRefreshError(
        "Authorization code is invalid or expired",
        "invalid_grant",
      );
    }
    throw new TokenRefreshError(
      `Token exchange failed with status ${response.status}`,
      "refresh_failed",
    );
  }

  let json: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  try {
    json = (await response.json()) as typeof json;
  } catch {
    throw new TokenRefreshError(
      "Token exchange response was not valid JSON",
      "refresh_failed",
    );
  }

  if (!json.access_token || typeof json.expires_in !== "number") {
    throw new TokenRefreshError(
      "Token exchange response missing access_token or expires_in",
      "refresh_failed",
    );
  }
  if (!json.refresh_token) {
    throw new TokenRefreshError(
      "Token exchange did not return a refresh_token — ensure prompt=consent was set",
      "refresh_failed",
    );
  }

  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_in: json.expires_in,
    scope: json.scope ?? "",
  };
}
