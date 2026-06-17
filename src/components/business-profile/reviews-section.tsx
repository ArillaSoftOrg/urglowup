import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare } from "lucide-react";
import { GoogleReviewsPlaceholder } from "./google-reviews-placeholder";
import type { BusinessWithDetails, GoogleReview } from "@/lib/queries/business";

interface ReviewSummary {
  averageRating: number | null;
  totalCount: number;
}

function RatingSummary({ summary }: { summary: ReviewSummary }) {
  if (summary.totalCount === 0) return null;

  return (
    <div className="flex items-center gap-3 pb-3">
      <span className="text-3xl font-bold">
        {summary.averageRating?.toFixed(1)}
      </span>
      <div>
        <p className="text-sm font-medium text-muted-foreground">/ 10</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {summary.totalCount} doğrulanmış değerlendirme
        </p>
      </div>
    </div>
  );
}

function formatReviewDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
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
            <div className="space-y-0">
              <RatingSummary summary={reviewSummary} />

              <div className="divide-y divide-border/50">
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
                    <div key={review.id} className="space-y-2 py-4 first:pt-0">
                      <div className="flex items-start gap-3">
                        <Avatar size="sm">
                          {review.customer.avatarUrl && (
                            <AvatarImage
                              src={review.customer.avatarUrl}
                              alt={name}
                            />
                          )}
                          <AvatarFallback>{initials || "M"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {name || "Müşteri"}
                            </p>
                            {review.appointmentId && (
                              <Badge variant="success" className="shrink-0 text-xs">
                                Doğrulanmış randevu
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums">
                              {(review.rating as number).toFixed(1)}
                              <span className="text-xs font-normal text-muted-foreground"> / 10</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatReviewDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
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
