"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Loader2, CalendarCheck } from "lucide-react";
import {
  submitReview,
  updateReview,
  type ReviewActionState,
} from "@/app/(customer)/account/reviews/actions";
import {
  RATING_LABELS,
  MAX_COMMENT_LENGTH,
} from "@/lib/constants/reviews";

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="rounded-sm p-0.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Star
              className={`size-6 transition-colors ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        );
      })}
      {(hovered || value) > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {RATING_LABELS[hovered || value]}
        </span>
      )}
    </div>
  );
}

interface ReviewFormProps {
  appointmentId?: string;
  businessName: string;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
  // Edit mode
  reviewId?: string;
  initialRating?: number;
  initialComment?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ReviewForm({
  appointmentId,
  businessName,
  serviceName,
  requestedDate,
  requestedTime,
  reviewId,
  initialRating = 0,
  initialComment = "",
  onCancel,
  onSuccess,
}: ReviewFormProps) {
  const isEdit = !!reviewId;
  const action = isEdit ? updateReview : submitReview;

  const [state, formAction, isPending] = useActionState<
    ReviewActionState,
    FormData
  >(action, { success: false });

  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);

  if (state.success && onSuccess) {
    onSuccess();
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{businessName}</p>
            <p className="text-sm text-muted-foreground">{serviceName}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarCheck className="size-3" />
            {requestedDate} at {requestedTime}
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          {appointmentId && (
            <input type="hidden" name="appointmentId" value={appointmentId} />
          )}
          {reviewId && (
            <input type="hidden" name="reviewId" value={reviewId} />
          )}
          <input type="hidden" name="rating" value={rating} />

          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
            {rating === 0 && state.message?.includes("Rating") && (
              <p className="text-sm text-destructive">Please select a rating</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`comment-${appointmentId || reviewId}`}>
              Comment (optional)
            </Label>
            <Textarea
              id={`comment-${appointmentId || reviewId}`}
              name="comment"
              placeholder="Share your experience..."
              maxLength={MAX_COMMENT_LENGTH}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/{MAX_COMMENT_LENGTH}
            </p>
          </div>

          {state.message && !state.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          {state.success && (
            <p className="text-sm text-green-600">{state.message}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending || rating === 0}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isEdit ? "Updating..." : "Submitting..."}
                </>
              ) : isEdit ? (
                "Update review"
              ) : (
                "Submit review"
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
