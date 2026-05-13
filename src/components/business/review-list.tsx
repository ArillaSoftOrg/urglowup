"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_COLORS,
} from "@/lib/constants/reviews";
import type { BusinessReview } from "@/lib/queries/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Stats Header ──────────────────────────────────────────────

function ReviewStats({
  averageRating,
  totalCount,
  ratingDistribution,
}: {
  averageRating: number | null;
  totalCount: number;
  ratingDistribution: Record<number, number>;
}) {
  if (totalCount === 0) return null;

  const maxCount = Math.max(...Object.values(ratingDistribution), 1);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-6">
          {/* Average */}
          <div className="text-center">
            <p className="text-4xl font-bold">
              {averageRating?.toFixed(1) ?? "—"}
            </p>
            <Stars rating={Math.round(averageRating ?? 0)} />
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} review{totalCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Distribution */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] ?? 0;
              const pct = totalCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-right text-muted-foreground">
                    {star}
                  </span>
                  <Star className="size-3 text-muted-foreground/50" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Review Card ───────────────────────────────────────────────

function BusinessReviewCard({ review }: { review: BusinessReview }) {
  const name = [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="space-y-2 border-b pb-4 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          {review.customer.avatarUrl && (
            <AvatarImage src={review.customer.avatarUrl} alt={name} />
          )}
          <AvatarFallback>{initials || "U"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">
              {name || "Customer"}
            </p>
            <Badge className={`text-[10px] ${REVIEW_STATUS_COLORS[review.status]}`}>
              {REVIEW_STATUS_LABELS[review.status]}
            </Badge>
          </div>
          <Stars rating={review.rating} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(review.createdAt)}
        </span>
      </div>

      {review.comment && (
        <p className="pl-9 text-sm text-muted-foreground">{review.comment}</p>
      )}

      {review.appointment && (
        <p className="pl-9 text-xs text-muted-foreground">
          {review.appointment.service?.name} &middot;{" "}
          {formatDate(review.appointment.requestedDate)} at{" "}
          {review.appointment.requestedTime}
        </p>
      )}
    </div>
  );
}

// ─── Main List ─────────────────────────────────────────────────

export function BusinessReviewList({
  reviews,
  stats,
}: {
  reviews: BusinessReview[];
  stats: {
    averageRating: number | null;
    totalCount: number;
    ratingDistribution: Record<number, number>;
  };
}) {
  return (
    <div className="space-y-4">
      <ReviewStats
        averageRating={stats.averageRating}
        totalCount={stats.totalCount}
        ratingDistribution={stats.ratingDistribution}
      />

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="size-6" />
              </div>
              <p className="mt-3 text-sm font-medium">No reviews yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reviews from your customers will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <BusinessReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
