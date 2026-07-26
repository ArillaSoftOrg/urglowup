"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { ExternalLink, Flag, Star } from "lucide-react";
import type { GoogleReview } from "@/lib/queries/business";

interface GoogleReviewsProps {
  reviews: GoogleReview[];
  businessName: string;
}

function RatingStars({ rating }: { rating: number }) {
  const roundedRating = Math.round(rating);

  return (
    <div
      className="flex gap-0.5"
      aria-label={`${rating.toLocaleString("tr-TR")} / 5 yıldız`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden
          className={
            index < roundedRating
              ? "size-3.5 fill-rating text-rating"
              : "size-3.5 fill-muted text-muted"
          }
        />
      ))}
    </div>
  );
}

function formatReviewDate(review: GoogleReview) {
  if (review.relativePublishTimeDescription) {
    return review.relativePublishTimeDescription;
  }
  if (!review.createTime) return null;

  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(new Date(review.createTime));
}

function Author({ review }: { review: GoogleReview }) {
  const avatar = (
    <Avatar className="size-9">
      {review.reviewerProfilePhotoUrl && (
        <AvatarImage
          src={review.reviewerProfilePhotoUrl}
          alt={`${review.reviewerDisplayName} profil fotoğrafı`}
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback>
        {review.reviewerDisplayName.charAt(0).toLocaleUpperCase("tr-TR") || "G"}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className="flex min-w-0 items-center gap-3">
      {review.reviewerProfileUrl ? (
        <a
          href={review.reviewerProfileUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={`${review.reviewerDisplayName} Google Maps profilini aç`}
          className="shrink-0 rounded-full focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {avatar}
        </a>
      ) : (
        avatar
      )}
      <div className="min-w-0">
        {review.reviewerProfileUrl ? (
          <a
            href={review.reviewerProfileUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="block truncate text-sm font-semibold text-foreground hover:underline"
          >
            {review.reviewerDisplayName}
          </a>
        ) : (
          <p className="truncate text-sm font-semibold text-foreground">
            {review.reviewerDisplayName}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatReviewDate(review) ?? "Google Maps yorumu"}
        </p>
      </div>
    </div>
  );
}

export function GoogleReviewsPlaceholder({
  reviews,
  businessName,
}: GoogleReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section
      aria-labelledby="google-reviews-heading"
      className="overflow-hidden rounded-xl border border-border/70 bg-surface-cream"
    >
      <header className="flex flex-col gap-2 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div>
          <h3
            id="google-reviews-heading"
            className="text-base font-semibold tracking-normal text-foreground"
          >
            Google yorumları
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Google, bu yorumları alaka düzeyine göre sıralar. UrGlowUp puanına
            dahil edilmez.
          </p>
        </div>
        <span
          translate="no"
          className="shrink-0 whitespace-nowrap font-sans text-sm font-normal tracking-normal text-[#5e5e5e]"
        >
          Google Maps
        </span>
      </header>

      <div className="divide-y divide-border/70">
        {reviews.map((review) => (
          <article key={review.id} className="px-4 py-5 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <Author review={review} />
              <RatingStars rating={review.rating} />
            </div>

            {review.comment && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground/85">
                {review.comment}
              </p>
            )}

            {review.isTranslated && review.originalComment && (
              <details className="mt-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium hover:text-foreground">
                  Google tarafından çevrildi, orijinal metni göster
                </summary>
                <p className="mt-2 whitespace-pre-line leading-5">
                  {review.originalComment}
                </p>
              </details>
            )}

            {review.merchantReply && (
              <div className="mt-3 rounded-lg bg-background px-3 py-2.5 text-sm">
                <p className="font-semibold text-foreground">
                  {businessName} yanıtladı
                </p>
                <p className="mt-1 whitespace-pre-line leading-5 text-muted-foreground">
                  {review.merchantReply}
                </p>
              </div>
            )}

            {(review.sourceUrl || review.reportUrl) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                {review.sourceUrl && (
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex min-h-7 items-center gap-1.5 font-medium text-foreground hover:underline"
                  >
                    Google Maps&apos;te görüntüle
                    <ExternalLink aria-hidden className="size-3" />
                  </a>
                )}
                {review.reportUrl && (
                  <a
                    href={review.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex min-h-7 items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <Flag aria-hidden className="size-3" />
                    Yorumu bildir
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
