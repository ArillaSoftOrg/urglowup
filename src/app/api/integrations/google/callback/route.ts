import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GOOGLE_MY_BUSINESS_ACCOUNT_MGMT_API } from "@/lib/constants/external";
import { db } from "@/lib/db";
import { getGoogleConfig } from "@/lib/external/google/config";
import { decryptTokenWithEnvKey, encryptTokenWithEnvKey } from "@/lib/external/google/encryption";
import { exchangeCodeForTokens } from "@/lib/external/google/oauth";
import { PENDING_COOKIE, STATE_COOKIE } from "../constants";

export const dynamic = "force-dynamic";

const PENDING_TTL_MS = 15 * 60 * 1000;

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

  if (oauthError || !code || !stateNonce) {
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookieStore = await cookies();
  const encryptedState = cookieStore.get(STATE_COOKIE)?.value;
  if (!encryptedState) {
    return NextResponse.redirect(integrationUrl);
  }

  let statePayload: StatePayload;
  try {
    statePayload = JSON.parse(
      decryptTokenWithEnvKey(encryptedState),
    ) as StatePayload;
  } catch {
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

  if (statePayload.nonce !== stateNonce || Date.now() > statePayload.expiresAt) {
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

  if (user.id !== statePayload.userId) {
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

  const member = await db.businessMember.findFirst({
    where: { userId: user.id, role: "OWNER" },
    select: { businessId: true },
    orderBy: { createdAt: "asc" },
  });
  if (!member || member.businessId !== statePayload.businessId) {
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

  let config;
  try {
    config = getGoogleConfig();
  } catch {
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(config, code);
  } catch {
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

  let accessTokenEncrypted: string;
  let refreshTokenEncrypted: string;
  try {
    accessTokenEncrypted = encryptTokenWithEnvKey(tokens.access_token);
    refreshTokenEncrypted = encryptTokenWithEnvKey(tokens.refresh_token);
  } catch {
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

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
    // Non-fatal.
  }

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
    const response = NextResponse.redirect(integrationUrl);
    clearStateCookie(response);
    return response;
  }

  const response = NextResponse.redirect(
    new URL("/business/integrations/google/select-location", request.url),
  );

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
