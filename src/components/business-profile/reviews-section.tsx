import { MessageSquare, Star } from "lucide-react";
import { ReviewList } from "./review-list";
import type {
  BusinessWithDetails,
  GoogleReviewData,
} from "@/lib/queries/business";

interface ReviewSummary {
  averageRating: number | null;
  totalCount: number;
}

function RatingStars({ rating }: { rating: number }) {
  const roundedRating = Math.round(rating);

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating.toLocaleString("tr-TR")} / 5 değerlendirme`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden
          className={
            index < roundedRating
              ? "size-6 fill-rating text-rating sm:size-7"
              : "size-6 fill-muted text-muted sm:size-7"
          }
        />
      ))}
    </div>
  );
}

function SourceRatingSummary({
  label,
  rating,
  count,
  googleAttribution = false,
}: {
  label: string;
  rating: number;
  count: number;
  googleAttribution?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p
        translate={googleAttribution ? "no" : undefined}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <RatingStars rating={rating} />
        <p className="text-lg font-bold leading-none text-foreground">
          {rating.toLocaleString("tr-TR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{" "}
          <span className="font-semibold text-brand-purple-foreground">
            ({count})
          </span>
        </p>
      </div>
    </div>
  );
}

export function ReviewsSection({
  business,
  reviewSummary,
  googleReviewData,
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
  googleReviewData?: GoogleReviewData;
}) {
  const googleReviews = googleReviewData?.reviews ?? [];
  const hasNativeReviews = business.reviews.length > 0;
  const hasGoogleReviews = googleReviews.length > 0;
  const hasAnyReviews = hasNativeReviews || hasGoogleReviews;
  const nativeRating =
    reviewSummary.averageRating === null
      ? null
      : reviewSummary.averageRating / 2;
  const googleRating = googleReviewData?.averageRating ?? null;

  return (
    <div className="space-y-8 border-t border-border/70 pt-10">
      <div className="space-y-5">
        <h2 className="text-2xl font-bold tracking-normal">
          Değerlendirmeler
        </h2>

        {!hasAnyReviews ? (
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
            {(nativeRating !== null || googleRating !== null) && (
              <div className="flex flex-wrap gap-x-10 gap-y-5">
                {nativeRating !== null && reviewSummary.totalCount > 0 && (
                  <SourceRatingSummary
                    label="UrGlowUp"
                    rating={nativeRating}
                    count={reviewSummary.totalCount}
                  />
                )}
                {googleRating !== null && (
                  <SourceRatingSummary
                    label="Google Maps"
                    rating={googleRating}
                    count={googleReviewData?.totalCount ?? googleReviews.length}
                    googleAttribution
                  />
                )}
              </div>
            )}

            <ReviewList
              nativeReviews={business.reviews}
              googleReviews={googleReviews}
              businessName={business.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}
