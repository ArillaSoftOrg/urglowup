import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import Link from "next/link";
import { GoogleReviewsPlaceholder } from "./google-reviews-placeholder";
import type { BusinessWithDetails } from "@/lib/queries/business";

interface ReviewSummary {
  averageRating: number | null;
  totalCount: number;
}

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

function RatingSummary({ summary }: { summary: ReviewSummary }) {
  if (summary.totalCount === 0) return null;

  return (
    <div className="flex items-center gap-3 pb-2">
      <span className="text-3xl font-bold">
        {summary.averageRating?.toFixed(1)}
      </span>
      <div>
        <Stars rating={Math.round(summary.averageRating ?? 0)} />
        <p className="mt-0.5 text-sm text-muted-foreground">
          {summary.totalCount} verified review
          {summary.totalCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

export function ReviewsSection({
  business,
  reviewSummary,
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          {reviewSummary.totalCount > 0 && (
            <CardDescription>
              {reviewSummary.totalCount} verified review
              {reviewSummary.totalCount !== 1 ? "s" : ""}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {business.reviews.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-cream">
                <MessageSquare className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">No reviews yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Be the first to review after your appointment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <RatingSummary summary={reviewSummary} />

              {business.reviews.map((review) => {
                const name = [
                  review.customer.firstName,
                  review.customer.lastName,
                ]
                  .filter(Boolean)
                  .join(" ");
                const initials = [
                  review.customer.firstName,
                  review.customer.lastName,
                ]
                  .filter(Boolean)
                  .map((n) => n!.charAt(0).toUpperCase())
                  .join("");

                return (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {review.customer.avatarUrl && (
                          <AvatarImage
                            src={review.customer.avatarUrl}
                            alt={name}
                          />
                        )}
                        <AvatarFallback>{initials || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {name || "Customer"}
                        </p>
                        <Stars rating={review.rating} />
                      </div>
                      {review.appointmentId && (
                        <Badge
                          variant="outline"
                          className="ml-auto shrink-0 text-xs"
                        >
                          Verified appointment
                        </Badge>
                      )}
                    </div>
                    {review.comment && (
                      <p className="pl-9 text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 border-t pt-3">
            <Link
              href="/account/reviews"
              className="text-sm font-medium text-primary hover:underline"
            >
              Had an appointment? Leave a review
            </Link>
          </div>
        </CardContent>
      </Card>

      <GoogleReviewsPlaceholder googlePlaceId={business.googlePlaceId} />
    </div>
  );
}
