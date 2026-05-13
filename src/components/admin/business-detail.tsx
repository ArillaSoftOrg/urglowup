"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Star } from "lucide-react";
import { updateBusinessStatus } from "@/app/(admin)/admin/actions";
import {
  BUSINESS_STATUS_LABELS,
  BUSINESS_STATUS_COLORS,
  ADMIN_STATUS_TRANSITIONS,
} from "@/lib/constants/business";
import { MEDIA_TYPE_LABELS } from "@/lib/constants/media";
import type { AdminBusinessDetail } from "@/lib/queries/admin";
import type { AdminAction } from "@/lib/queries/admin";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  return (
    <div className="space-y-6">
      {/* Status + Actions */}
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
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">
                {[business.district, business.city].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-muted-foreground">{business.phone ?? "—"}</p>
            </div>
            <div>
              <p className="font-medium">Marketplace Visible</p>
              <p className="text-muted-foreground">
                {business.isMarketplaceVisible ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="font-medium">Created</p>
              <p className="text-muted-foreground">
                {formatDate(business.createdAt)}
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

      {/* Counts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{business._count.appointments}</p>
            <p className="text-sm text-muted-foreground">Appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{business._count.reviews}</p>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{business._count.media}</p>
            <p className="text-sm text-muted-foreground">Media</p>
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
                    <img
                      src={m.url}
                      alt={m.title ?? "Media"}
                      className="size-full object-cover"
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
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`size-3 ${
                              i < r.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
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
