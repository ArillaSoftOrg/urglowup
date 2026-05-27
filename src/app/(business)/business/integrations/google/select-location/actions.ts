"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PENDING_COOKIE } from "@/app/api/integrations/google/constants";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptTokenWithEnvKey } from "@/lib/external/google/encryption";

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
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (!business || business.id !== pending.businessId) {
    redirect("/business/integrations");
  }

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

  cookieStore.delete(PENDING_COOKIE);

  redirect("/business/integrations");
}
