import { MessageSquare, Star } from "lucide-react";
import { GoogleReviewsPlaceholder } from "./google-reviews-placeholder";
import { ReviewList } from "./review-list";
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
  const starClass = size === "lg" ? "size-8" : "size-4";

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
    <div className="flex flex-wrap items-center gap-3">
      <RatingStars rating={fivePointRating} size="lg" />
      <p className="text-lg font-bold leading-none text-foreground">
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
    <div className="space-y-8 border-t border-border/70 pt-10">
      <div className="space-y-5">
        <h2 className="text-2xl font-bold tracking-normal">
          Değerlendirmeler
        </h2>

        {business.reviews.length === 0 ? (
          <div className="flex max-w-xl items-start gap-4 rounded-xl border border-border/70 px-5 py-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-cream text-muted-foreground">
              <MessageSquare className="size-5" strokeWidth={1.6} />
            </span>
            <div>
              <h3 className="font-semibold tracking-normal text-foreground">
                Henüz değerlendirme yok
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Bu işletme için henüz yayınlanmış değerlendirme bulunmuyor.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <RatingSummary summary={reviewSummary} />
            <ReviewList reviews={business.reviews} />
          </div>
        )}
      </div>

      {googleReviews.length > 0 && (
        <GoogleReviewsPlaceholder
          reviews={googleReviews}
          businessName={business.name}
        />
      )}
    </div>
  );
}
