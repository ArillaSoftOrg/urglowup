import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare, Star } from "lucide-react";
import { GoogleReviewsPlaceholder } from "./google-reviews-placeholder";
import type { BusinessWithDetails, GoogleReview } from "@/lib/queries/business";

interface ReviewSummary {
  averageRating: number | null;
  totalCount: number;
}

function RatingStars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const roundedRating = Math.round(rating);
  const starClass = size === "lg" ? "size-9" : "size-4";

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
                ? `${starClass} fill-rating text-rating`
                : `${starClass} fill-muted text-muted`
            }
          />
        );
      })}
    </div>
  );
}

function RatingSummary({ summary }: { summary: ReviewSummary }) {
  if (summary.totalCount === 0) return null;

  const fivePointRating = (summary.averageRating ?? 0) / 2;

  return (
    <div className="space-y-3 pb-8">
      <RatingStars rating={fivePointRating} size="lg" />
      <p className="text-lg font-bold leading-none">
        {fivePointRating.toLocaleString("tr-TR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}{" "}
        <span className="font-semibold text-brand-purple-foreground">
          ({summary.totalCount})
        </span>
      </p>
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

export function ReviewsSection({
  business,
  reviewSummary,
  googleReviews = [],
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
  googleReviews?: GoogleReview[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Değerlendirmeler</CardTitle>
        </CardHeader>
        <CardContent>
          {business.reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              headline="Henüz değerlendirme yok"
              description="Bu işletme için henüz yayınlanmış değerlendirme bulunmuyor."
              surface="cream"
              compact
            />
          ) : (
            <div>
              <RatingSummary summary={reviewSummary} />

              <div className="grid gap-x-14 gap-y-12 md:grid-cols-2">
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
                    <article key={review.id} className="min-w-0 space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-20 bg-surface-purple text-brand-purple-foreground after:border-transparent">
                          {review.customer.avatarUrl && (
                            <AvatarImage
                              src={review.customer.avatarUrl}
                              alt={name}
                            />
                          )}
                          <AvatarFallback className="bg-surface-purple text-2xl font-bold text-brand-purple-foreground">
                            {initials || "M"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="min-w-0 truncate text-lg font-semibold leading-tight">
                              {name || "Müşteri"}
                            </p>
                            {review.appointmentId && (
                              <Badge variant="success" className="shrink-0">
                                Doğrulanmış randevu
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatReviewDate(review.createdAt)}
                          </p>
                        </div>
                      </div>

                      <RatingStars rating={(review.rating as number) / 2} />

                      {review.comment && (
                        <p className="text-xl leading-snug text-foreground">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {googleReviews.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <GoogleReviewsPlaceholder
              reviews={googleReviews}
              businessName={business.name}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
