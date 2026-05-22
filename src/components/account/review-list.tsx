"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Pencil, Trash2, Loader2, CalendarCheck } from "lucide-react";
import { ReviewForm } from "./review-form";
import { removeReview } from "@/app/(customer)/account/reviews/actions";
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_COLORS,
  EDITABLE_STATUSES,
} from "@/lib/constants/reviews";
import type { CustomerReview } from "@/lib/queries/reviews";
import type { ReviewableAppointment } from "@/lib/queries/reviews";

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

// ─── Reviewable Appointments ───────────────────────────────────

function ReviewableAppointmentCard({
  appointment,
}: {
  appointment: ReviewableAppointment;
}) {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <ReviewForm
        appointmentId={appointment.id}
        businessName={appointment.business.name}
        serviceName={appointment.service.name}
        requestedDate={formatDate(appointment.requestedDate)}
        requestedTime={appointment.requestedTime}
        onCancel={() => setShowForm(false)}
        onSuccess={() => setShowForm(false)}
      />
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="min-w-0">
          <p className="font-medium">{appointment.business.name}</p>
          <p className="text-sm text-muted-foreground">
            {appointment.service.name}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarCheck className="size-3" />
            {formatDate(appointment.requestedDate)} tarihinde{" "}
            {appointment.requestedTime}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Star className="size-3" />
          Yorum yaz
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Existing Review Card ──────────────────────────────────────

function ReviewCard({ review }: { review: CustomerReview }) {
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditable = EDITABLE_STATUSES.includes(review.status);
  const isRemoved = review.status === "REMOVED";
  const isHidden = review.status === "HIDDEN";

  function handleRemove() {
    startTransition(async () => {
      const result = await removeReview(review.id);
      if (result.success) {
        setConfirmRemove(false);
      }
    });
  }

  if (editing) {
    return (
      <ReviewForm
        reviewId={review.id}
        businessName={review.business.name}
        serviceName={review.appointment?.service?.name ?? "Service"}
        requestedDate={
          review.appointment
            ? formatDate(review.appointment.requestedDate)
            : ""
        }
        requestedTime={review.appointment?.requestedTime ?? ""}
        initialRating={review.rating}
        initialComment={review.comment ?? ""}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  return (
    <Card className={isRemoved || isHidden ? "opacity-60" : ""}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="font-medium">{review.business.name}</p>
            {review.appointment && (
              <p className="text-xs text-muted-foreground">
                {review.appointment.service?.name} &middot;{" "}
                {formatDate(review.appointment.requestedDate)} tarihinde{" "}
                {review.appointment.requestedTime}
              </p>
            )}
          </div>
          <Badge className={REVIEW_STATUS_COLORS[review.status]}>
            {REVIEW_STATUS_LABELS[review.status]}
          </Badge>
        </div>

        {isRemoved ? (
          <p className="text-sm italic text-muted-foreground">
            Yorum kaldırıldı
          </p>
        ) : isHidden ? (
          <p className="text-sm italic text-muted-foreground">
            Yorum moderatör tarafından gizlendi
          </p>
        ) : (
          <>
            <Stars rating={review.rating} />
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
          </>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
          </p>
          {isEditable && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3" />
                Düzenle
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="size-3" />
                Kaldır
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yorum kaldırılsın mı?</DialogTitle>
            <DialogDescription>
              Yorumunuz herkese açık sayfadan kaldırılacak. Bu işlem geri alınamaz ve bu randevu için yeni yorum yazamazsınız.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemove(false)}
              disabled={isPending}
            >
              Yorumu koru
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Kaldırılıyor...
                </>
              ) : (
                "Kaldır"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Main List ─────────────────────────────────────────────────

export function CustomerReviewList({
  reviews,
  reviewableAppointments,
}: {
  reviews: CustomerReview[];
  reviewableAppointments: ReviewableAppointment[];
}) {
  const hasContent = reviews.length > 0 || reviewableAppointments.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="space-y-6">
      {reviewableAppointments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Yorum bekleyen</h2>
          <div className="space-y-3">
            {reviewableAppointments.map((apt) => (
              <ReviewableAppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Yorumlarınız</h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
