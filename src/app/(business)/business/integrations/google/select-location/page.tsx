/**
 * Google Business Profile location selection page.
 *
 * Renders after a successful OAuth callback. The user picks which Google location
 * to link to their UrGlowUp business. The connection is only created in the DB
 * once a location is confirmed.
 *
 * Redirects to /business/integrations if the pending OAuth session is absent or expired.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireBusiness } from "@/lib/auth";
import { decryptTokenWithEnvKey } from "@/lib/external/google/encryption";
import { PENDING_COOKIE } from "@/app/api/integrations/google/callback/route";
import { SelectLocationForm } from "./select-location-form";
import type { LocationItem } from "@/app/api/integrations/google/locations/route";

export const metadata = { title: "Google Business Profile — Lokasyon Seçin" };

async function safeReadGoogleError(res: Response): Promise<{ status: number; errorStatus: string; message: string }> {
  try {
    const json = (await res.json()) as { error?: { message?: string; status?: string } | string };
    if (typeof json.error === "object" && json.error) {
      return {
        status: res.status,
        errorStatus: json.error.status ?? "",
        message: json.error.message ?? `HTTP ${res.status}`,
      };
    }
    if (typeof json.error === "string") return { status: res.status, errorStatus: "", message: json.error };
  } catch {
    // body unreadable
  }
  return { status: res.status, errorStatus: "", message: `HTTP ${res.status}` };
}

function isQuotaError(err: { status: number; errorStatus: string; message: string }): boolean {
  if (err.status === 429) return true;
  if (err.errorStatus === "RESOURCE_EXHAUSTED") return true;
  const msg = err.message.toLowerCase();
  return msg.includes("quota exceeded") || msg.includes("quota of 0");
}

const QUOTA_ERROR_MSG =
  "Google Business Profile API erişimi henüz Google tarafından onaylanmadı. Lütfen daha sonra tekrar deneyin.";

// The Business Information API for locations
const BUSINESS_INFO_API =
  "https://mybusinessbusinessinformation.googleapis.com/v1";
const ACCOUNTS_API =
  "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
const READ_MASK =
  "name,title,storefrontAddress,metadata,phoneNumbers,categories,websiteUri";

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

export default async function SelectLocationPage() {
  const { user, businessId } = await requireBusiness();

  // Read + decrypt pending cookie
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

  if (
    Date.now() > pending.expiresAt ||
    pending.userId !== user.id ||
    pending.businessId !== businessId
  ) {
    redirect("/business/integrations");
  }

  // Decrypt access token — plaintext is only in server memory during this render
  let accessToken: string;
  try {
    accessToken = decryptTokenWithEnvKey(pending.accessTokenEncrypted);
  } catch {
    redirect("/business/integrations");
  }

  // Fetch locations from Google
  let locations: LocationItem[] = [];
  let fetchError: string | null = null;

  try {
    const accRes = await fetch(ACCOUNTS_API, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!accRes.ok) {
      const safeErr = await safeReadGoogleError(accRes);
      fetchError = isQuotaError(safeErr) ? QUOTA_ERROR_MSG : "Google hesapları alınamadı.";
    } else {
      const accData = (await accRes.json()) as { accounts?: GoogleAccount[] };
      const accounts = accData.accounts ?? [];

      for (const account of accounts) {
        const accountIdStr = account.name.split("/")[1] ?? account.name;
        const accountNameStr = account.accountName ?? accountIdStr;

        const locEndpoint = `${BUSINESS_INFO_API}/${account.name}/locations`;
        const params = new URLSearchParams({ readMask: READ_MASK });
        const locRes = await fetch(
          `${locEndpoint}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (!locRes.ok) {
          const locErr = await safeReadGoogleError(locRes);
          if (isQuotaError(locErr)) {
            fetchError = QUOTA_ERROR_MSG;
            break;
          }
          continue;
        }

        const locData = (await locRes.json()) as { locations?: GoogleLocation[] };
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
    }
  } catch {
    fetchError = "Google konumları yüklenirken bir hata oluştu.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Business Profile Lokasyonu Seçin</h1>
        <p className="text-muted-foreground">
          Hesabınızla ilişkilendirmek istediğiniz lokasyonu seçin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lokasyonlar</CardTitle>
          <CardDescription>
            Aşağıdaki Google Business Profile lokasyonlarından birini seçin.
            Google değerlendirmeleri ve fotoğrafları bu lokasyondan çekilecektir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {fetchError}
            </div>
          ) : locations.length === 0 ? (
            <div className="rounded-xl border border-warning/30 bg-warning/15 p-3 text-sm text-warning-foreground">
              Bu Google hesabında hiç lokasyon bulunamadı. Google Business Profile
              üzerinden bir lokasyon oluşturun ve tekrar deneyin.
            </div>
          ) : (
            <SelectLocationForm locations={locations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
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
  if (typeof addr.administrativeArea === "string")
    parts.push(addr.administrativeArea);
  if (typeof addr.postalCode === "string") parts.push(addr.postalCode);
  if (typeof addr.regionCode === "string") parts.push(addr.regionCode);
  return parts.length > 0 ? parts.join(", ") : null;
}
