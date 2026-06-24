"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

type Review = BusinessWithDetails["reviews"][number];

function RatingStars({ rating }: { rating: number }) {
  const roundedRating = Math.round(rating);

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating.toFixed(1)} / 5 değerlendirme`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < roundedRating;

        return (
          <Star
            key={index}
            className={
              isFilled
                ? "size-4 fill-rating text-rating"
                : "size-4 fill-muted text-muted"
            }
          />
        );
      })}
    </div>
  );
}

function formatReviewDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function ReviewArticle({ review }: { review: Review }) {
  const name = [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .map((part) => part!.charAt(0).toUpperCase())
    .join("");

  return (
    <article className="min-w-0 space-y-4 py-7 first:pt-0 last:pb-0">
      <div className="flex items-start gap-4">
        <Avatar className="size-16 bg-surface-purple text-brand-purple-foreground after:border-transparent">
          {review.customer.avatarUrl && (
            <AvatarImage src={review.customer.avatarUrl} alt={name} />
          )}
          <AvatarFallback className="bg-surface-purple text-xl font-bold text-brand-purple-foreground">
            {initials || "M"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-lg font-semibold leading-tight">
              {name || "Müşteri"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatReviewDate(review.createdAt)}
          </p>
          <RatingStars rating={(review.rating as number) / 2} />
        </div>
      </div>

      {review.comment && (
        <p className="max-w-[72ch] text-lg leading-8 text-foreground">
          {review.comment}
        </p>
      )}

      {review.businessReply && (
        <div className="max-w-[72ch] rounded-lg bg-surface-cream px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            İşletme yanıtı
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            {review.businessReply}
          </p>
        </div>
      )}
    </article>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = reviews.length > 6;
  const visibleReviews = showAll ? reviews : reviews.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="divide-y divide-border/70">
        {visibleReviews.map((review) => (
          <ReviewArticle key={review.id} review={review} />
        ))}
      </div>

      {hasMore && !showAll && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setShowAll(true)}
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          Tümünü gör
        </Button>
      )}
    </div>
  );
}
