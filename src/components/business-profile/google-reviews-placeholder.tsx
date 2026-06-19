"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import type { GoogleReview } from "@/lib/queries/business";

interface GoogleReviewsProps {
  reviews: GoogleReview[];
  businessName: string;
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 > 0;

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < fullStars;
        const isHalf = i === fullStars && hasHalfStar;

        return (
          <Star
            key={i}
            className={`size-3.5 ${
              isFull || isHalf
                ? "fill-rating text-rating"
                : "text-muted"
            }`}
          />
        );
      })}
    </div>
  );
}

function formatReviewDate(date: Date | null) {
  if (!date) return "Recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function GoogleReviewsPlaceholder({
  reviews,
  businessName,
}: GoogleReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t border-border/50 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Google Reviews</h3>
        <Badge variant="secondary" className="text-xs gap-1">
          <MapPin className="size-3" />
          Google
        </Badge>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-border/50 p-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="size-8 flex-shrink-0">
                  {review.reviewerProfilePhotoUrl && (
                    <AvatarImage
                      src={review.reviewerProfilePhotoUrl}
                      alt={review.reviewerDisplayName}
                    />
                  )}
                  <AvatarFallback>
                    {review.reviewerDisplayName?.charAt(0).toUpperCase() || "G"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {review.reviewerDisplayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatReviewDate(review.createTime)}
                  </p>
                </div>
              </div>
              <RatingStars rating={review.rating} />
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-foreground/80 mb-2 line-clamp-3">
                {review.comment}
              </p>
            )}

            {/* Merchant reply */}
            {review.merchantReply && (
              <div className="rounded bg-muted p-2 text-xs">
                <p className="font-medium text-foreground mb-1">
                  Response from {businessName}:
                </p>
                <p className="text-muted-foreground line-clamp-2">
                  {review.merchantReply}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
