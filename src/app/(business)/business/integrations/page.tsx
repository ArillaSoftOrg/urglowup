import { requireBusiness } from "@/lib/auth";
import { getConnection } from "@/lib/external/connection-service";
import { getReviewCacheStats } from "@/lib/external/review-cache-service";
import {
  CONNECTION_STATUS_LABELS,
  CONNECTION_STATUS_COLORS,
  SYNC_STATUS_LABELS,
  SYNC_STATUS_COLORS,
  MANUAL_SYNC_COOLDOWN_MS,
} from "@/lib/constants/external";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SyncNowButton } from "./sync-now-button";

export const metadata = { title: "Integrations" };

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function IntegrationsPage() {
  const { businessId } = await requireBusiness();

  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI
  );

  const connection = await getConnection(businessId, "GOOGLE_BUSINESS_PROFILE");

  const reviewStats =
    connection?.status === "ACTIVE"
      ? await getReviewCacheStats(businessId)
      : null;

  const now = new Date();
  const cooldownEndsAt = connection?.lastSyncAt
    ? new Date(connection.lastSyncAt.getTime() + MANUAL_SYNC_COOLDOWN_MS)
    : null;
  const isInCooldown = cooldownEndsAt ? cooldownEndsAt > now : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services to display additional content on your profile.
        </p>
      </div>

      {/* Google Business Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Business Profile</CardTitle>
              <CardDescription>
                Display your Google reviews and photos on your UrGlowUp profile.
                Google ratings are shown separately and never merged with your UrGlowUp rating.
              </CardDescription>
            </div>
            {connection && (
              <Badge
                className={
                  CONNECTION_STATUS_COLORS[connection.status] ??
                  "bg-gray-100 text-gray-800"
                }
              >
                {CONNECTION_STATUS_LABELS[connection.status] ?? connection.status}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!connection ? (
            <div className="space-y-3">
              {googleConfigured ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Google Business Profile henüz bağlanmadı.
                  </p>
                  <a
                    href="/api/integrations/google/start"
                    className={buttonVariants()}
                  >
                    Google Business Profile Bağla
                  </a>
                </>
              ) : (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  Google entegrasyonu henüz yapılandırılmadı.
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Connection details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Account</p>
                  <p>{connection.providerAccountName ?? connection.providerAccountId}</p>
                </div>
                {connection.providerLocationName && (
                  <div>
                    <p className="font-medium text-muted-foreground">Location</p>
                    <p>{connection.providerLocationName}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-muted-foreground">Sync Status</p>
                  <Badge
                    className={
                      SYNC_STATUS_COLORS[connection.syncStatus] ??
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {SYNC_STATUS_LABELS[connection.syncStatus] ?? connection.syncStatus}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Last Synced</p>
                  <p>
                    {connection.lastSyncAt
                      ? `${formatRelativeTime(connection.lastSyncAt)} (${formatDateTime(connection.lastSyncAt)})`
                      : "Never"}
                  </p>
                </div>
                {connection.nextSyncAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">Next Sync</p>
                    <p>{formatDateTime(connection.nextSyncAt)}</p>
                  </div>
                )}
                {reviewStats && (
                  <div>
                    <p className="font-medium text-muted-foreground">Cached Reviews</p>
                    <p>
                      {reviewStats.visibleCount} visible
                      {reviewStats.totalCached !== reviewStats.visibleCount
                        ? ` (${reviewStats.totalCached} total)`
                        : ""}
                      {reviewStats.averageRating !== null
                        ? ` · ${reviewStats.averageRating.toFixed(1)} avg`
                        : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Error display */}
              {connection.syncStatus === "ERROR" && connection.lastError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-medium">Sync error</p>
                  <p className="mt-1">{connection.lastError}</p>
                </div>
              )}

              {/* EXPIRED status — reconnect prompt */}
              {connection.status === "EXPIRED" && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 space-y-2">
                  <p className="font-medium">Yeniden bağlantı gerekiyor</p>
                  <p>
                    Google erişim tokenınızın süresi doldu. Senkronizasyona devam etmek için
                    lütfen Google Business Profile hesabınızı yeniden bağlayın.
                  </p>
                  {googleConfigured && (
                    <a
                      href="/api/integrations/google/start"
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Google Business Profile Bağla
                    </a>
                  )}
                </div>
              )}

              {/* Manual sync button */}
              {connection.status === "ACTIVE" && (
                <div className="flex items-center gap-3">
                  <SyncNowButton
                    isSyncing={connection.syncStatus === "SYNCING"}
                    isInCooldown={isInCooldown}
                    cooldownEndsAt={cooldownEndsAt}
                  />
                  {isInCooldown && cooldownEndsAt && (
                    <p className="text-sm text-muted-foreground">
                      Next sync available at {formatDateTime(cooldownEndsAt)}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
