"use server";

/**
 * Server Actions for the Google Business Profile location selection step.
 *
 * confirmLocation — called when the business owner selects their Google location.
 *
 * Steps:
 *   1. Auth check — verify still authenticated + still the same user from the OAuth flow.
 *   2. Read + validate the pending OAuth cookie.
 *   3. Upsert the BusinessExternalConnection with status=ACTIVE, syncStatus=IDLE.
 *   4. Delete the pending cookie.
 *   5. Redirect to /business/integrations.
 *
 * Hard rules:
 *   - Plaintext tokens are never stored, logged, or serialized beyond this function.
 *   - The connection is created or updated atomically via Prisma upsert.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { decryptTokenWithEnvKey } from "@/lib/external/google/encryption";
import { PENDING_COOKIE } from "@/app/api/integrations/google/callback/route";

interface PendingPayload {
  businessId: string;
  userId: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAtMs: number;
  scopes: string[];
  expiresAt: number;
}

export async function confirmLocation(
  locationId: string,
  accountId: string,
  locationName: string,
  accountName: string,
  placeId: string | null,
) {
  // 1. Auth
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/login");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect("/login");

  // 2. Read + validate pending cookie
  const cookieStore = await cookies();
  const encryptedPending = cookieStore.get(PENDING_COOKIE)?.value;
  if (!encryptedPending) redirect("/business/integrations");

  let pending: PendingPayload;
  try {
    pending = JSON.parse(
      decryptTokenWithEnvKey(encryptedPending),
    ) as PendingPayload;
  } catch {
    redirect("/business/integrations");
  }

  if (Date.now() > pending.expiresAt) redirect("/business/integrations");
  if (pending.userId !== user.id) redirect("/business/integrations");

  // Also verify the businessId in the cookie matches the business the current
  // user actually owns — prevents a stale or mis-bound cookie from writing a
  // connection to the wrong business.
  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (!business || business.id !== pending.businessId) {
    redirect("/business/integrations");
  }

  // 3. Upsert BusinessExternalConnection — status=ACTIVE only after location is confirmed
  await db.businessExternalConnection.upsert({
    where: {
      businessId_provider: {
        businessId: pending.businessId,
        provider: "GOOGLE_BUSINESS_PROFILE",
      },
    },
    create: {
      businessId: pending.businessId,
      provider: "GOOGLE_BUSINESS_PROFILE",
      providerAccountId: accountId,
      providerAccountName: accountName,
      providerLocationId: locationId,
      providerLocationName: locationName,
      placeId: placeId ?? undefined,
      connectedByUserId: user.id,
      scopes: pending.scopes,
      accessTokenEncrypted: pending.accessTokenEncrypted,
      refreshTokenEncrypted: pending.refreshTokenEncrypted,
      tokenExpiresAt: new Date(pending.tokenExpiresAtMs),
      status: "ACTIVE",
      syncStatus: "IDLE",
      nextSyncAt: new Date(),
    },
    update: {
      providerAccountId: accountId,
      providerAccountName: accountName,
      providerLocationId: locationId,
      providerLocationName: locationName,
      placeId: placeId ?? undefined,
      connectedByUserId: user.id,
      scopes: pending.scopes,
      accessTokenEncrypted: pending.accessTokenEncrypted,
      refreshTokenEncrypted: pending.refreshTokenEncrypted,
      tokenExpiresAt: new Date(pending.tokenExpiresAtMs),
      status: "ACTIVE",
      syncStatus: "IDLE",
      nextSyncAt: new Date(),
      disconnectedAt: null,
      lastError: null,
    },
  });

  // 4. Clear the pending cookie
  cookieStore.delete(PENDING_COOKIE);

  // 5. Back to integrations
  redirect("/business/integrations");
}
