/**
 * Google OAuth start route - initiates the OAuth 2.0 authorization flow.
 */
import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGoogleConfig, buildGoogleAuthUrl } from "@/lib/external/google/config";
import { encryptTokenWithEnvKey } from "@/lib/external/google/encryption";
import { STATE_COOKIE } from "../constants";

export const dynamic = "force-dynamic";
const STATE_TTL_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  const integrationUrl = new URL("/business/integrations", request.url);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const member = await db.businessMember.findFirst({
    where: { userId: user.id, role: "OWNER" },
    select: { businessId: true },
  });

  if (!member) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const business = await db.business.findUnique({
    where: { id: member.businessId },
    select: { id: true },
  });

  if (!business) {
    return NextResponse.redirect(new URL("/business/onboarding", request.url));
  }

  let config;
  try {
    config = getGoogleConfig();
  } catch {
    return NextResponse.redirect(integrationUrl);
  }

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
  } catch {
    return NextResponse.redirect(integrationUrl);
  }

  const response = NextResponse.redirect(buildGoogleAuthUrl(config, nonce));

  response.cookies.set(STATE_COOKIE, encryptedState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Math.floor(STATE_TTL_MS / 1000),
    path: "/",
  });

  return response;
}
