"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Star, MessageSquare } from "lucide-react";
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_VARIANTS,
} from "@/lib/constants/reviews";
import type { BusinessReview } from "@/lib/queries/reviews";

function Stars({ rating }: { rating: number }) {
  const filledStars = Math.round(rating / 2);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < filledStars
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
    <Card className="bg-surface-cream">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-6">
          {/* Average */}
          <div className="min-w-[5rem] text-center">
            <p className="text-4xl font-bold tracking-[-0.02em]">
              {averageRating?.toFixed(1) ?? "—"}
            </p>
            <div className="flex justify-center">
              <Stars rating={averageRating ?? 0} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} review{totalCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Distribution */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] ?? 0;
              const pct = totalCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-right text-xs text-muted-foreground">
                    {star}
                  </span>
                  <Star className="size-3 text-amber-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-pink transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-xs text-muted-foreground">
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
            <Badge variant={REVIEW_STATUS_VARIANTS[review.status]}>
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
            <EmptyState
              icon={MessageSquare}
              headline="No reviews yet"
              description="Reviews from customers with completed appointments will appear here."
              surface="cream"
              compact
            />
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
