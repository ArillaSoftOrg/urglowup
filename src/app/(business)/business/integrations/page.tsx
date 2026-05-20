import { requireBusiness } from "@/lib/auth";
import { getConnection } from "@/lib/external/connection-service";
import { getReviewCacheStats } from "@/lib/external/review-cache-service";
import {
  CONNECTION_STATUS_LABELS,
  SYNC_STATUS_LABELS,
  MANUAL_SYNC_COOLDOWN_MS,
} from "@/lib/constants/external";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { SyncNowButton } from "./sync-now-button";
import type { BadgeVariant } from "@/components/ui/badge";

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

const CONNECTION_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  EXPIRED: "warning",
  DISCONNECTED: "neutral",
  ERROR: "destructive",
};

const SYNC_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  IDLE: "neutral",
  SYNCING: "info",
  ERROR: "destructive",
};

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
      <BusinessPageHeader
        title="Integrations"
        description="Connect external services to display additional content on your profile."
      />

      {/* Google Business Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Google Business Profile</CardTitle>
              <CardDescription>
                Display your Google reviews and photos on your UrGlowUp profile.
                Google ratings are shown separately and never merged with your UrGlowUp rating.
              </CardDescription>
            </div>
            {connection && (
              <Badge variant={CONNECTION_STATUS_VARIANTS[connection.status] ?? "neutral"}>
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
                    Google Business Profile is not connected yet.
                  </p>
                  <a
                    href="/api/integrations/google/start"
                    className={buttonVariants()}
                  >
                    Connect Google Business Profile
                  </a>
                </>
              ) : (
                <div className="rounded-xl border border-warning/30 bg-warning/15 p-3 text-sm text-warning-foreground">
                  Google integration is not configured yet. Contact support to enable this feature.
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Connection details */}
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-surface-cream p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account</p>
                  <p className="mt-0.5 font-medium">{connection.providerAccountName ?? connection.providerAccountId}</p>
                </div>
                {connection.providerLocationName && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</p>
                    <p className="mt-0.5 font-medium">{connection.providerLocationName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sync Status</p>
                  <div className="mt-1">
                    <Badge variant={SYNC_STATUS_VARIANTS[connection.syncStatus] ?? "neutral"}>
                      {SYNC_STATUS_LABELS[connection.syncStatus] ?? connection.syncStatus}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Synced</p>
                  <p className="mt-0.5">
                    {connection.lastSyncAt
                      ? `${formatRelativeTime(connection.lastSyncAt)}`
                      : "Never"}
                  </p>
                </div>
                {connection.nextSyncAt && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next Sync</p>
                    <p className="mt-0.5">{formatDateTime(connection.nextSyncAt)}</p>
                  </div>
                )}
                {reviewStats && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cached Reviews</p>
                    <p className="mt-0.5">
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
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">Sync error</p>
                  <p className="mt-1">{connection.lastError}</p>
                </div>
              )}

              {/* EXPIRED status — reconnect prompt */}
              {connection.status === "EXPIRED" && (
                <div className="space-y-2 rounded-xl border border-warning/30 bg-warning/15 p-3 text-sm text-warning-foreground">
                  <p className="font-medium">Reconnection required</p>
                  <p>
                    Your Google access token has expired. Please reconnect your Google Business
                    Profile account to continue syncing.
                  </p>
                  {googleConfigured && (
                    <a
                      href="/api/integrations/google/start"
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Reconnect Google Business Profile
                    </a>
                  )}
                </div>
              )}

              {/* Manual sync button */}
              {connection.status === "ACTIVE" && (
                <div className="flex flex-wrap items-center gap-3">
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
