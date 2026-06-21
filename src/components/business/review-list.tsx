"use client";

import { useActionState, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Star, MessageSquare, Reply, Trash2 } from "lucide-react";
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_VARIANTS,
} from "@/lib/constants/reviews";
import { replyToReview, deleteReviewReply } from "@/app/(business)/business/reviews/actions";
import type { BusinessReview } from "@/lib/queries/reviews";
import type { ReviewReplyState } from "@/app/(business)/business/reviews/actions";

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
  return new Date(date).toLocaleDateString("tr-TR", {
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
        <div className="flex items-start gap-3 sm:gap-6">
          {/* Average */}
          <div className="min-w-[5rem] text-center">
            <p className="text-4xl font-bold tracking-[-0.02em]">
              {averageRating?.toFixed(1) ?? "—"}
            </p>
            <div className="flex justify-center">
              <Stars rating={averageRating ?? 0} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} değerlendirme
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

// ─── Reply Form ────────────────────────────────────────────────

function ReplyForm({ review }: { review: BusinessReview }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const boundAction = replyToReview.bind(null, review.id);
  const initial: ReviewReplyState = { success: false, error: "" };
  const [state, formAction] = useActionState(boundAction, initial);

  if (state.success && open) setOpen(false);

  async function handleDelete() {
    setIsPending(true);
    await deleteReviewReply(review.id);
    setIsPending(false);
  }

  if (review.businessReply) {
    return (
      <div className="ml-9 space-y-1 rounded-lg border-l-2 border-brand-pink/40 bg-muted/30 px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground">İşletme yanıtı</p>
        {open ? (
          <form action={formAction} className="space-y-2">
            <Textarea
              name="reply"
              defaultValue={review.businessReply}
              maxLength={1000}
              rows={3}
              className="resize-none text-sm"
            />
            {"error" in state && state.error && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm">Güncelle</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-sm text-foreground">{review.businessReply}</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setOpen(true)} className="text-xs text-muted-foreground hover:text-foreground">Düzenle</button>
              <button onClick={handleDelete} disabled={isPending} className="text-xs text-destructive/70 hover:text-destructive">
                {isPending ? "Siliniyor..." : "Yanıtı sil"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="ml-9">
      {open ? (
        <form action={formAction} className="space-y-2">
          <Textarea
            name="reply"
            placeholder="Müşteriye yanıt yazın..."
            maxLength={1000}
            rows={3}
            className="resize-none text-sm"
            autoFocus
          />
          {"error" in state && state.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm"><Reply className="size-3.5" /> Yanıtla</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Reply className="size-3.5" />
          Yanıtla
        </button>
      )}
    </div>
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
              {name || "Müşteri"}
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
          {formatDate(review.appointment.requestedDate)} &middot;{" "}
          {review.appointment.requestedTime}
        </p>
      )}

      {review.status === "APPROVED" && <ReplyForm review={review} />}
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
          <CardTitle>Tüm Değerlendirmeler</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              headline="Henüz değerlendirme yok"
              description="Tamamlanan randevular için müşteri değerlendirmeleri burada görünür."
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
