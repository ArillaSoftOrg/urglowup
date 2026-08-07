/* eslint-disable @next/next/no-html-link-for-pages */
import { requireBusiness } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  CONNECTION_STATUS_LABELS,
  MANUAL_SYNC_COOLDOWN_MS,
  SYNC_STATUS_LABELS,
} from "@/lib/constants/external";
import { getConnection } from "@/lib/external/connection-service";
import { getReviewCacheStats } from "@/lib/external/review-cache-service";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncNowButton } from "./sync-now-button";

export const metadata = { title: "Entegrasyonlar" };

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 60) {
    return `${diffMins} dakika önce`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} saat önce`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("tr-TR", {
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
  const { businessId } = await requireBusiness("OWNER");

  const googleConfigured = Boolean(
    env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET &&
      env.GOOGLE_REDIRECT_URI,
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
        title="Entegrasyonlar"
        description="Profilinizde ek içerik görüntülemek için harici hizmetleri bağlayın."
      />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Google Business Profile</CardTitle>
              <CardDescription>
                Google yorumlarınızı ve fotoğraflarınızı UrGlowUp profilinizde görüntüleyin.
                Google puanları ayrı gösterilir, UrGlowUp puanınızla birleştirilmez.
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
                    Google Business Profile henüz bağlanmadı.
                  </p>
                  <a href="/api/integrations/google/start" className={buttonVariants()}>
                    {"Google Business Profile'ı Bağla"}
                  </a>
                </>
              ) : (
                <div className="rounded-xl border border-warning/30 bg-warning/15 p-3 text-sm text-warning-foreground">
                  Google entegrasyonu henüz yapılandırılmadı. Bu özelliği etkinleştirmek için
                  destek ekibiyle iletişime geçin.
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-surface-cream p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Hesap
                  </p>
                  <p className="mt-0.5 font-medium">
                    {connection.providerAccountName ?? connection.providerAccountId}
                  </p>
                </div>
                {connection.providerLocationName && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Konum
                    </p>
                    <p className="mt-0.5 font-medium">{connection.providerLocationName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Senkronizasyon Durumu
                  </p>
                  <div className="mt-1">
                    <Badge variant={SYNC_STATUS_VARIANTS[connection.syncStatus] ?? "neutral"}>
                      {SYNC_STATUS_LABELS[connection.syncStatus] ?? connection.syncStatus}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Son Senkronizasyon
                  </p>
                  <p className="mt-0.5">
                    {connection.lastSyncAt
                      ? formatRelativeTime(connection.lastSyncAt)
                      : "Hiç"}
                  </p>
                </div>
                {connection.nextSyncAt && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Sonraki Senkronizasyon
                    </p>
                    <p className="mt-0.5">{formatDateTime(connection.nextSyncAt)}</p>
                  </div>
                )}
                {reviewStats && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Önbelleğe Alınan Yorumlar
                    </p>
                    <p className="mt-0.5">
                      {reviewStats.visibleCount} görünür
                      {reviewStats.totalCached !== reviewStats.visibleCount
                        ? ` (${reviewStats.totalCached} toplam)`
                        : ""}
                      {reviewStats.averageRating !== null
                        ? ` · ${reviewStats.averageRating.toFixed(1)} ort.`
                        : ""}
                    </p>
                  </div>
                )}
              </div>

              {connection.syncStatus === "ERROR" && connection.lastError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">Senkronizasyon hatası</p>
                  <p className="mt-1">{connection.lastError}</p>
                </div>
              )}

              {connection.status === "EXPIRED" && (
                <div className="space-y-2 rounded-xl border border-warning/30 bg-warning/15 p-3 text-sm text-warning-foreground">
                  <p className="font-medium">Yeniden Bağlantı Gerekiyor</p>
                  <p>
                    Google erişim tokenınızın süresi doldu. Senkronizasyona devam etmek için
                    Google Business Profile hesabınızı yeniden bağlayın.
                  </p>
                  {googleConfigured && (
                    <a
                      href="/api/integrations/google/start"
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      {"Google Business Profile'ı Yeniden Bağla"}
                    </a>
                  )}
                </div>
              )}

              {connection.status === "ACTIVE" && (
                <div className="flex flex-wrap items-center gap-3">
                  <SyncNowButton
                    isSyncing={connection.syncStatus === "SYNCING"}
                    isInCooldown={isInCooldown}
                    cooldownEndsAt={cooldownEndsAt}
                  />
                  {isInCooldown && cooldownEndsAt && (
                    <p className="text-sm text-muted-foreground">
                      Sonraki senkronizasyon: {formatDateTime(cooldownEndsAt)}
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
