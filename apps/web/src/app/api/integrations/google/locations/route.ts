import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GOOGLE_MY_BUSINESS_ACCOUNT_MGMT_API } from "@/lib/constants/external";
import { decryptTokenWithEnvKey } from "@/lib/external/google/encryption";
import { PENDING_COOKIE } from "../constants";

export const dynamic = "force-dynamic";

const BUSINESS_INFO_API =
  "https://mybusinessbusinessinformation.googleapis.com/v1";

const READ_MASK =
  "name,title,storefrontAddress,metadata,phoneNumbers,categories,websiteUri";

interface PendingPayload {
  businessId: string;
  userId: string;
  accessTokenEncrypted: string;
  tokenExpiresAtMs: number;
  expiresAt: number;
}

interface GoogleAccount {
  name: string;
  accountName?: string;
}

interface GoogleLocation {
  name: string;
  title?: string;
  storefrontAddress?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  websiteUri?: string;
}

export interface LocationItem {
  locationId: string;
  locationName: string;
  accountId: string;
  accountName: string;
  address: string | null;
  placeId: string | null;
  websiteUri: string | null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const encryptedPending = cookieStore.get(PENDING_COOKIE)?.value;
  if (!encryptedPending) {
    return NextResponse.json(
      { error: "No pending OAuth session found" },
      { status: 400 },
    );
  }

  let pending: PendingPayload;
  try {
    pending = JSON.parse(
      decryptTokenWithEnvKey(encryptedPending),
    ) as PendingPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid pending session" },
      { status: 400 },
    );
  }

  if (Date.now() > pending.expiresAt) {
    return NextResponse.json(
      { error: "OAuth session expired - please reconnect" },
      { status: 400 },
    );
  }

  if (pending.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let accessToken: string;
  try {
    accessToken = decryptTokenWithEnvKey(pending.accessTokenEncrypted);
  } catch {
    return NextResponse.json(
      { error: "Token decryption failed" },
      { status: 500 },
    );
  }

  const locations: LocationItem[] = [];

  try {
    const accRes = await fetch(
      `${GOOGLE_MY_BUSINESS_ACCOUNT_MGMT_API}/accounts`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!accRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Google accounts" },
        { status: 502 },
      );
    }

    const accData = (await accRes.json()) as { accounts?: GoogleAccount[] };

    for (const account of accData.accounts ?? []) {
      const accountIdStr = account.name.split("/")[1] ?? account.name;
      const accountNameStr = account.accountName ?? accountIdStr;
      const locParams = new URLSearchParams({ readMask: READ_MASK });

      const locRes = await fetch(
        `${BUSINESS_INFO_API}/${account.name}/locations?${locParams.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!locRes.ok) {
        continue;
      }

      const locData = (await locRes.json()) as {
        locations?: GoogleLocation[];
      };

      for (const loc of locData.locations ?? []) {
        const locationIdStr = loc.name.split("/").at(-1) ?? loc.name;
        const placeId =
          typeof loc.metadata?.placeId === "string"
            ? loc.metadata.placeId
            : null;

        locations.push({
          locationId: locationIdStr,
          locationName: loc.title ?? locationIdStr,
          accountId: accountIdStr,
          accountName: accountNameStr,
          address: extractAddress(loc.storefrontAddress ?? null),
          placeId,
          websiteUri: loc.websiteUri ?? null,
        });
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch locations from Google" },
      { status: 502 },
    );
  }

  return NextResponse.json({ locations });
}

function extractAddress(
  addr: Record<string, unknown> | null,
): string | null {
  if (!addr) return null;

  const parts: string[] = [];
  if (Array.isArray(addr.addressLines)) {
    parts.push(...(addr.addressLines as string[]));
  }
  if (typeof addr.locality === "string") parts.push(addr.locality);
  if (typeof addr.administrativeArea === "string") {
    parts.push(addr.administrativeArea);
  }
  if (typeof addr.postalCode === "string") parts.push(addr.postalCode);
  if (typeof addr.regionCode === "string") parts.push(addr.regionCode);

  return parts.length > 0 ? parts.join(", ") : null;
}
