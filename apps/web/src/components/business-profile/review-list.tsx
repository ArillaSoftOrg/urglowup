"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink, Flag, Star } from "lucide-react";
import type {
  BusinessWithDetails,
  GoogleReview,
} from "@/lib/queries/business";

type NativeReview = BusinessWithDetails["reviews"][number];

type ReviewItem =
  | { key: string; source: "URGLOWUP"; review: NativeReview }
  | { key: string; source: "GOOGLE"; review: GoogleReview };

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
              ? "size-4 fill-rating text-rating"
              : "size-4 fill-muted text-muted"
          }
        />
      ))}
    </div>
  );
}

function formatNativeReviewDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatGoogleReviewDate(review: GoogleReview) {
  if (review.relativePublishTimeDescription) {
    return review.relativePublishTimeDescription;
  }
  if (!review.createTime) return "Google Maps yorumu";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(review.createTime));
}

function NativeReviewArticle({ review }: { review: NativeReview }) {
  const name = [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .map((part) => part!.charAt(0).toLocaleUpperCase("tr-TR"))
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
          <p className="min-w-0 truncate text-lg font-semibold leading-tight">
            {name || "Müşteri"}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatNativeReviewDate(review.createdAt)}
          </p>
          <RatingStars rating={Number(review.rating) / 2} />
        </div>
      </div>

      {review.comment && (
        <p className="max-w-[72ch] whitespace-pre-line text-lg leading-8 text-foreground">
          {review.comment}
        </p>
      )}

      {review.businessReply && (
        <div className="max-w-[72ch] rounded-lg bg-surface-cream px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            İşletme yanıtı
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {review.businessReply}
          </p>
        </div>
      )}
    </article>
  );
}

function GoogleReviewArticle({
  review,
  businessName,
}: {
  review: GoogleReview;
  businessName: string;
}) {
  const initial =
    review.reviewerDisplayName.charAt(0).toLocaleUpperCase("tr-TR") || "G";
  const avatar = (
    <Avatar className="size-16 bg-surface-purple text-brand-purple-foreground after:border-transparent">
      {review.reviewerProfilePhotoUrl && (
        <AvatarImage
          src={review.reviewerProfilePhotoUrl}
          alt={`${review.reviewerDisplayName} profil fotoğrafı`}
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback className="bg-surface-purple text-xl font-bold text-brand-purple-foreground">
        {initial}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <article className="min-w-0 space-y-4 py-7 first:pt-0 last:pb-0">
      <div className="flex items-start gap-4">
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
        <div className="min-w-0 flex-1 space-y-2">
          {review.reviewerProfileUrl ? (
            <a
              href={review.reviewerProfileUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block truncate text-lg font-semibold leading-tight hover:underline"
            >
              {review.reviewerDisplayName}
            </a>
          ) : (
            <p className="truncate text-lg font-semibold leading-tight">
              {review.reviewerDisplayName}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {formatGoogleReviewDate(review)}
          </p>
          <RatingStars rating={review.rating} />
        </div>
      </div>

      {review.comment && (
        <p className="max-w-[72ch] whitespace-pre-line text-lg leading-8 text-foreground">
          {review.comment}
        </p>
      )}

      {review.isTranslated && review.originalComment && (
        <details className="max-w-[72ch] text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium hover:text-foreground">
            Google tarafından çevrildi, orijinal metni göster
          </summary>
          <p className="mt-2 whitespace-pre-line leading-6">
            {review.originalComment}
          </p>
        </details>
      )}

      {review.merchantReply && (
        <div className="max-w-[72ch] rounded-lg bg-surface-cream px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            {businessName} yanıtladı
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {review.merchantReply}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {review.sourceUrl ? (
          <a
            href={review.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            translate="no"
            className="inline-flex min-h-11 items-center gap-1.5 font-normal tracking-normal text-muted-foreground hover:text-foreground hover:underline"
          >
            Google Maps
            <ExternalLink aria-hidden className="size-3" />
          </a>
        ) : (
          <span
            translate="no"
            className="inline-flex min-h-11 items-center font-normal tracking-normal text-muted-foreground"
          >
            Google Maps
          </span>
        )}
        {review.reportUrl && (
          <a
            href={review.reportUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
          >
            <Flag aria-hidden className="size-3" />
            Yorumu bildir
          </a>
        )}
      </div>
    </article>
  );
}

export function ReviewList({
  nativeReviews,
  googleReviews,
  businessName,
}: {
  nativeReviews: NativeReview[];
  googleReviews: GoogleReview[];
  businessName: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const items: ReviewItem[] = [
    ...nativeReviews.map(
      (review): ReviewItem => ({
        key: `urglowup-${review.id}`,
        source: "URGLOWUP",
        review,
      }),
    ),
    ...googleReviews.map(
      (review): ReviewItem => ({
        key: `google-${review.id}`,
        source: "GOOGLE",
        review,
      }),
    ),
  ];
  const hasMore = items.length > 6;
  const visibleItems = showAll ? items : items.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="divide-y divide-border/70">
        {visibleItems.map((item) =>
          item.source === "URGLOWUP" ? (
            <NativeReviewArticle key={item.key} review={item.review} />
          ) : (
            <GoogleReviewArticle
              key={item.key}
              review={item.review}
              businessName={businessName}
            />
          ),
        )}
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
