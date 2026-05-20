/**
 * Google OAuth callback route — completes the OAuth 2.0 flow.
 *
 * Route:   GET /api/integrations/google/callback
 * Access:  Google redirects here after the user grants/denies consent.
 *
 * Steps:
 *   1. Verify state nonce from query param matches the encrypted state cookie.
 *   2. Exchange the authorization code for access + refresh tokens.
 *   3. Encrypt both tokens with AES-256-GCM.
 *   4. Fetch the Google account name for display purposes (best-effort).
 *   5. Store the pending OAuth session in an encrypted httpOnly cookie.
 *   6. Redirect to the location selection page.
 *
 * Security rules:
 *   - Plaintext tokens exist only as local variables — never logged or stored.
 *   - State nonce mismatch or expiry causes an immediate redirect with cookie cleanup.
 *   - User denial (error=access_denied) is handled gracefully.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { decryptTokenWithEnvKey, encryptTokenWithEnvKey } from "@/lib/external/google/encryption";
import { getGoogleConfig } from "@/lib/external/google/config";
import { exchangeCodeForTokens } from "@/lib/external/google/oauth";
import { GOOGLE_MY_BUSINESS_ACCOUNT_MGMT_API } from "@/lib/constants/external";
import { db } from "@/lib/db";
import { STATE_COOKIE } from "../start/route";

const PENDING_COOKIE = "google_oauth_pending";
const PENDING_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface StatePayload {
  nonce: string;
  userId: string;
  businessId: string;
  expiresAt: number;
}

interface PendingPayload {
  businessId: string;
  userId: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAtMs: number;
  scopes: string[];
  accountId: string;
  accountName: string;
  expiresAt: number;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateNonce = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const integrationUrl = new URL("/business/integrations", request.url);

  // User denied consent — clean up state cookie and return
  if (oauthError) {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }

  if (!code || !stateNonce) {
    return NextResponse.redirect(integrationUrl);
  }

  // 1. Auth check — caller must still be authenticated
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Validate state cookie
  const cookieStore = await cookies();
  const encryptedState = cookieStore.get(STATE_COOKIE)?.value;
  if (!encryptedState) {
    return NextResponse.redirect(integrationUrl);
  }

  let statePayload: StatePayload;
  try {
    statePayload = JSON.parse(decryptTokenWithEnvKey(encryptedState)) as StatePayload;
  } catch {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }

  if (
    statePayload.nonce !== stateNonce ||
    Date.now() > statePayload.expiresAt
  ) {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }

  // 2b. Bind state to the current authenticated session:
  //     verify the Clerk session resolves to the same DB user and business
  //     that initiated the flow. Without this, a replayed state cookie could
  //     complete an OAuth flow under the wrong identity.
  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser || dbUser.id !== statePayload.userId) {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }
  const dbBusiness = await db.business.findUnique({
    where: { ownerId: dbUser.id },
    select: { id: true },
  });
  if (!dbBusiness || dbBusiness.id !== statePayload.businessId) {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }

  // 3. Get Google config
  let config;
  try {
    config = getGoogleConfig();
  } catch {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }

  // 4. Exchange authorization code for tokens
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(config, code);
  } catch {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }

  // 5. Encrypt tokens — plaintext must not persist beyond this scope
  let accessTokenEncrypted: string;
  let refreshTokenEncrypted: string;
  try {
    accessTokenEncrypted = encryptTokenWithEnvKey(tokens.access_token);
    refreshTokenEncrypted = encryptTokenWithEnvKey(tokens.refresh_token);
  } catch {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }

  // 6. Best-effort: fetch the primary Google account name for display
  let accountId = "";
  let accountName = "";
  try {
    const accRes = await fetch(
      `${GOOGLE_MY_BUSINESS_ACCOUNT_MGMT_API}/accounts`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (accRes.ok) {
      const accData = (await accRes.json()) as {
        accounts?: Array<{ name: string; accountName?: string }>;
      };
      const first = accData.accounts?.[0];
      if (first) {
        accountId = first.name.split("/")[1] ?? first.name;
        accountName = first.accountName ?? "";
      }
    }
  } catch {
    // Non-fatal: location selection page will fetch accounts fresh
  }

  // 7. Build and encrypt the pending session payload
  const pendingPayload: PendingPayload = {
    businessId: statePayload.businessId,
    userId: statePayload.userId,
    accessTokenEncrypted,
    refreshTokenEncrypted,
    tokenExpiresAtMs: Date.now() + tokens.expires_in * 1000,
    scopes: tokens.scope.split(/\s+/).filter(Boolean),
    accountId,
    accountName,
    expiresAt: Date.now() + PENDING_TTL_MS,
  };

  let encryptedPending: string;
  try {
    encryptedPending = encryptTokenWithEnvKey(JSON.stringify(pendingPayload));
  } catch {
    const res = NextResponse.redirect(integrationUrl);
    clearStateCookie(res);
    return res;
  }

  // 8. Clear state cookie, set pending cookie, redirect to location selection
  const selectLocationUrl = new URL(
    "/business/integrations/google/select-location",
    request.url,
  );
  const response = NextResponse.redirect(selectLocationUrl);

  clearStateCookie(response);
  response.cookies.set(PENDING_COOKIE, encryptedPending, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Math.floor(PENDING_TTL_MS / 1000),
    path: "/",
  });

  return response;
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
}

export { PENDING_COOKIE };
