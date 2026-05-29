"use client";

import { useTransition } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Star,
  Zap,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Shield,
} from "lucide-react";
import { updateBusinessStatus } from "@/app/(admin)/admin/actions";
import {
  BUSINESS_STATUS_LABELS,
  BUSINESS_STATUS_COLORS,
  ADMIN_STATUS_TRANSITIONS,
} from "@/lib/constants/business";
import { MEDIA_TYPE_LABELS } from "@/lib/constants/media";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { computeBusinessSignals } from "@/lib/admin/business-signals";
import type { AdminBusinessDetail } from "@/lib/queries/admin";
import type { AdminAction } from "@/lib/queries/admin";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastActive(date: Date | null): string {
  if (!date) return "Never";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function buildProfileCompletionData(business: AdminBusinessDetail) {
  return {
    name: business.name,
    description: business.description,
    phone: business.phone,
    whatsapp: business.whatsapp,
    city: business.city,
    address: business.address,
    coverImageUrl: business.coverImageUrl,
    logoUrl: business.logoUrl,
    categories: business.categories.map((c) => ({ categoryId: c.categoryId })),
    services: business.services.map((s) => ({ id: s.id })),
    hours: business.hours.map((h) => ({ id: h.id })),
    media: business.media.map((m) => ({ id: m.id })),
  };
}

function StatusActions({ business }: { business: AdminBusinessDetail }) {
  const [isPending, startTransition] = useTransition();
  const transitions = ADMIN_STATUS_TRANSITIONS[business.status];

  function handleChange(newStatus: string) {
    startTransition(async () => {
      await updateBusinessStatus(business.id, newStatus as AdminBusinessDetail["status"]);
    });
  }

  if (transitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((status) => (
        <Button
          key={status}
          variant={status === "SUSPENDED" || status === "REJECTED" ? "destructive" : "outline"}
          size="sm"
          onClick={() => handleChange(status)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : null}
          {BUSINESS_STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  );
}

export function BusinessDetailView({
  business,
  actionHistory,
}: {
  business: AdminBusinessDetail;
  actionHistory: AdminAction[];
}) {
  const ownerName = [business.owner.firstName, business.owner.lastName]
    .filter(Boolean)
    .join(" ");

  const completion = calculateProfileCompletion(
    buildProfileCompletionData(business)
  );
  const signals = computeBusinessSignals(business);

  return (
    <div className="space-y-6">
      {/* Header + Status + Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{business.name}</CardTitle>
            <Badge className={BUSINESS_STATUS_COLORS[business.status]}>
              {BUSINESS_STATUS_LABELS[business.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusActions business={business} />

          <Separator />

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium">Owner</p>
              <p className="text-muted-foreground">
                {ownerName || "—"} ({business.owner.email})
              </p>
            </div>
            <div>
              <p className="font-medium">Slug</p>
              <p className="text-muted-foreground">/b/{business.slug}</p>
            </div>
            <div>
              <p className="font-medium">Created</p>
              <p className="text-muted-foreground">
                {formatDate(business.createdAt)}
              </p>
            </div>
            <div>
              <p className="font-medium">Marketplace Visible</p>
              <p className="text-muted-foreground">
                {business.isMarketplaceVisible ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {business.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {business.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Health Overview & Profile Completeness */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Rating
              </p>
              {business.ratingStats && business.ratingStats.bayesianScore !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {business.ratingStats.bayesianScore.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / 10 ({business.ratingStats.rawReviewCount} reviews)
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No ratings yet</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Last Activity
              </p>
              <p className="text-sm">{formatLastActive(business.lastActivityAt)}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Location Info
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  {business.address ? (
                    <>
                      <span className="font-medium">Address:</span> {business.address}
                    </>
                  ) : (
                    <span className="text-muted-foreground">No address set</span>
                  )}
                </p>
                {business.city && (
                  <p>
                    <span className="font-medium">City:</span> {business.city}
                    {business.district && `, ${business.district}`}
                  </p>
                )}
                {business.whatsapp && (
                  <p>
                    <span className="font-medium">WhatsApp:</span> {business.whatsapp}
                  </p>
                )}
                {business.phone && (
                  <p>
                    <span className="font-medium">Phone:</span> {business.phone}
                  </p>
                )}
                {business.instagramUrl && (
                  <p>
                    <span className="font-medium">Instagram:</span>{" "}
                    <a
                      href={business.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {business.instagramUrl}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {business.geocodingStatus || business.geocodingError ? (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Geocoding
                  </p>
                  {business.geocodingError ? (
                    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                      <AlertTriangle className="size-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Error</p>
                        <p className="text-xs">{business.geocodingError}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Status: {business.geocodingStatus}
                      {business.geocodedAt && (
                        <> (last updated {formatDate(business.geocodedAt)})</>
                      )}
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Profile Completeness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Completeness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{completion.score}%</p>
                <p className="text-xs text-muted-foreground">
                  {completion.completedCount}/{completion.totalCount}
                </p>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    completion.score >= 90
                      ? "bg-green-500"
                      : completion.score >= 60
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${completion.score}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {completion.items.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  {item.done ? (
                    <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className={item.done ? "" : "text-muted-foreground"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signals */}
      {(signals.risks.length > 0 || signals.opportunities.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {signals.risks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  Risk Signals ({signals.risks.length})
                </p>
                <div className="space-y-2">
                  {signals.risks.map((signal) => (
                    <div
                      key={signal.id}
                      className={`p-2 rounded border text-sm ${
                        signal.severity === "high"
                          ? "border-red-200 bg-red-50"
                          : signal.severity === "medium"
                          ? "border-amber-200 bg-amber-50"
                          : "border-yellow-200 bg-yellow-50"
                      }`}
                    >
                      <p className="font-medium">{signal.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {signal.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {signals.opportunities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  Opportunities ({signals.opportunities.length})
                </p>
                <div className="space-y-2">
                  {signals.opportunities.map((signal) => (
                    <div
                      key={signal.id}
                      className="p-2 rounded border border-green-200 bg-green-50 text-sm"
                    >
                      <p className="font-medium">{signal.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {signal.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{business._count.appointments}</p>
            <p className="text-xs text-muted-foreground mt-1">Bookings</p>
            {business.lastAppointment && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {formatDate(business.lastAppointment.createdAt)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{business._count.reviews}</p>
            <p className="text-xs text-muted-foreground mt-1">Reviews</p>
            {business.pendingReviewCount > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                {business.pendingReviewCount} pending
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              {"posts" in business ? business.posts.length : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Posts</p>
            {"posts" in business && business.posts.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {formatDate(business.posts[0].createdAt)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{business._count.media}</p>
            <p className="text-xs text-muted-foreground mt-1">Media</p>
            {business.hiddenMediaCount > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                {business.hiddenMediaCount} hidden
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      {business.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {business.services.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-muted-foreground">
                    {s.durationMinutes} min
                    {s.price ? ` · $${Number(s.price)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Media */}
      {business.media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {business.media.map((m) => (
                <div key={m.id} className="relative aspect-square overflow-hidden rounded-lg">
                  {m.type === "PORTFOLIO_VIDEO" ? (
                    <video
                      src={m.url}
                      className="size-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <Image
                      src={m.url}
                      alt={m.title ?? "Media"}
                      fill
                      className="object-cover"
                    />
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute left-1 top-1 text-[10px]"
                  >
                    {MEDIA_TYPE_LABELS[m.type]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reviews */}
      {business.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {business.reviews.map((r) => {
                const name = [r.customer.firstName, r.customer.lastName]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div key={r.id} className="border-b pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {name || "Customer"}
                      </span>
                      <div className="flex gap-0.5">
                        {(() => {
                          const filledStars = Math.round(r.rating / 2);
                          return Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`size-3 ${
                                i < filledStars
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ));
                        })()}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {r.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts */}
      {"posts" in business && business.posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {business.posts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 text-sm"
                >
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {p.contentType}
                    </Badge>
                    <Badge variant="secondary" className="text-xs ml-1">
                      {p.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(p.createdAt)} · {p._count.media} media · {p._count.saves} saves
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Action History */}
      {actionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin Action History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionHistory.map((a) => {
                const adminName = [a.admin.firstName, a.admin.lastName]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium">{adminName}</span>{" "}
                      <span className="text-muted-foreground">{a.action}</span>
                      {a.details && (
                        <span className="text-muted-foreground">
                          {" "}— {a.details}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(a.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
