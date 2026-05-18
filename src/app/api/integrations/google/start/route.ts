/**
 * Google OAuth start route — initiates the OAuth 2.0 authorization flow.
 *
 * Route:   GET /api/integrations/google/start
 * Access:  BUSINESS_OWNER only
 *
 * Steps:
 *   1. Verify the caller is a logged-in BUSINESS_OWNER with an existing business.
 *   2. Generate a random CSRF nonce.
 *   3. Encrypt { nonce, userId, businessId, expiresAt } → store in httpOnly cookie.
 *   4. Build Google OAuth consent URL and redirect.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { getGoogleConfig, buildGoogleAuthUrl } from "@/lib/external/google/config";
import { encryptTokenWithEnvKey } from "@/lib/external/google/encryption";

export const STATE_COOKIE = "google_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  const integrationUrl = new URL("/business/integrations", request.url);

  // TEMPORARY DIAGNOSTIC LOGS — remove after root cause confirmed
  console.log("[google/start] hasGoogleClientId:", !!process.env.GOOGLE_CLIENT_ID);
  console.log("[google/start] hasGoogleClientSecret:", !!process.env.GOOGLE_CLIENT_SECRET);
  console.log("[google/start] hasGoogleRedirectUri:", !!process.env.GOOGLE_REDIRECT_URI);
  console.log("[google/start] hasGoogleScopes:", !!process.env.GOOGLE_BUSINESS_PROFILE_SCOPES);
  console.log("[google/start] hasEncryptionKey:", !!process.env.OAUTH_TOKEN_ENCRYPTION_KEY);

  // 1. Auth — must be a logged-in BUSINESS_OWNER
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    console.log("[google/start] redirectReason: no clerkId");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  });

  console.log("[google/start] hasUser:", !!user);
  console.log("[google/start] userRole:", user?.role ?? "none");

  if (!user || user.role !== UserRole.BUSINESS_OWNER) {
    console.log("[google/start] redirectReason: not BUSINESS_OWNER");
    return NextResponse.redirect(new URL("/", request.url));
  }

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  console.log("[google/start] hasBusiness:", !!business);

  if (!business) {
    console.log("[google/start] redirectReason: no business");
    return NextResponse.redirect(new URL("/business/onboarding", request.url));
  }

  // 2. Verify Google OAuth is configured
  let config;
  try {
    config = getGoogleConfig();
  } catch (err) {
    console.log("[google/start] redirectReason: getGoogleConfig threw —", err instanceof Error ? err.message : String(err));
    return NextResponse.redirect(integrationUrl);
  }

  // TEMPORARY DIAGNOSTIC: client_id shape checks
  console.log("[google/start] clientIdExists:", !!config.clientId);
  console.log("[google/start] clientIdEndsWithGoogleusercontent:", config.clientId.endsWith(".apps.googleusercontent.com"));
  console.log("[google/start] clientIdLength:", config.clientId.length);
  console.log("[google/start] clientIdPrefix:", config.clientId.slice(0, 12));
  console.log("[google/start] redirectUri:", config.redirectUri);
  console.log("[google/start] scope:", config.scopes.join(" "));

  // 3. Generate nonce + encrypted state cookie
  const nonce = crypto.randomUUID();
  const statePayload = JSON.stringify({
    nonce,
    userId: user.id,
    businessId: business.id,
    expiresAt: Date.now() + STATE_TTL_MS,
  });

  let encryptedState: string;
  try {
    encryptedState = encryptTokenWithEnvKey(statePayload);
  } catch (err) {
    console.log("[google/start] redirectReason: encryptTokenWithEnvKey threw —", err instanceof Error ? err.message : String(err));
    return NextResponse.redirect(integrationUrl);
  }

  // 4. Redirect to Google consent URL, attach state cookie to the response
  const authUrl = buildGoogleAuthUrl(config, nonce);

  // TEMPORARY DIAGNOSTIC: auth URL shape checks
  const _authUrlObj = new URL(authUrl);
  const _authUrlParams = _authUrlObj.searchParams;
  console.log("[google/start] authUrlHost:", _authUrlObj.host);
  console.log("[google/start] authUrlHasClientSecretParam:", _authUrlParams.has("client_secret"));
  console.log("[google/start] authUrlClientIdMatchesEnv:", _authUrlParams.get("client_id") === process.env.GOOGLE_CLIENT_ID);

  const response = NextResponse.redirect(authUrl);

  response.cookies.set(STATE_COOKIE, encryptedState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Math.floor(STATE_TTL_MS / 1000),
    path: "/",
  });

  return response;
}
