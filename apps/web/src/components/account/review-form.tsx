"use client";

import { useState, useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CalendarCheck } from "lucide-react";
import {
  submitReview,
  updateReview,
  type ReviewActionState,
} from "@/app/(customer)/account/reviews/actions";
import { MAX_COMMENT_LENGTH } from "@/lib/constants/reviews";

// ─── Colour interpolation ─────────────────────────────────────────────────────

const RED: [number, number, number] = [239, 68, 68];
const AMBER: [number, number, number] = [245, 158, 11];
const GREEN: [number, number, number] = [34, 197, 94];

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function getTrackColor(v: number): string {
  return v <= 5 ? lerpRgb(RED, AMBER, v / 5) : lerpRgb(AMBER, GREEN, (v - 5) / 5);
}

// ─── Descriptive label ────────────────────────────────────────────────────────

function getRatingLabel(v: number): string {
  if (v < 2) return "Berbat";
  if (v < 4) return "Kötü";
  if (v < 6) return "Orta";
  if (v < 7.5) return "İyi";
  if (v < 9) return "Çok İyi";
  return "Mükemmel";
}

// ─── RatingSlider ─────────────────────────────────────────────────────────────

function RatingSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const prevWhole = useRef(Math.floor(value));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = parseFloat(e.target.value);
    const nextWhole = Math.floor(next);
    if (nextWhole !== prevWhole.current) {
      prevWhole.current = nextWhole;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(10);
      }
    }
    onChange(next);
  }

  const pct = value / 10; // 0..1
  const color = getTrackColor(value);
  const label = getRatingLabel(value);
  const showTooltip = isDragging || value > 0;

  // Centre tooltip over thumb, correcting for thumb radius (~10px at each edge).
  const tooltipLeft = `calc(${pct * 100}% + ${10 - pct * 20}px)`;

  return (
    <div className="relative select-none pt-11 pb-1">
      {/* Floating tooltip */}
      <div
        aria-hidden
        className={`pointer-events-none absolute top-0 z-10 -translate-x-1/2 transition-opacity duration-150 ${
          showTooltip ? "opacity-100" : "opacity-0"
        }`}
        style={{ left: tooltipLeft }}
      >
        <div className="relative rounded-lg bg-foreground px-2.5 py-1.5 text-center shadow-lg">
          <p className="text-sm font-bold leading-none text-background">
            {value.toFixed(1)}
          </p>
          <p className="mt-0.5 text-[10px] leading-none text-background/70">
            {label}
          </p>
        </div>
        {/* Downward arrow */}
        <div
          aria-hidden
          className="mx-auto h-0 w-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-foreground"
        />
      </div>

      {/* Track + range input */}
      <div className="relative flex h-10 items-center">
        {/* Visual track (aria-hidden, decorative) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: `${pct * 100}%`, background: color }}
          />
        </div>

        {/* Native range input — thumb visible, native track hidden */}
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={value}
          onChange={handleChange}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          aria-label="Rating"
          aria-valuetext={value > 0 ? `${value.toFixed(1)} out of 10, ${label}` : "No rating selected"}
          className={[
            "absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent focus:outline-none",
            // hide native track
            "[&::-webkit-slider-runnable-track]:opacity-0",
            "[&::-moz-range-track]:bg-transparent",
            // webkit thumb
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-white",
            "[&::-webkit-slider-thumb]:shadow-md",
            "[&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-primary/30",
            // moz thumb
            "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:border-0",
            "[&::-moz-range-thumb]:bg-white",
            "[&::-moz-range-thumb]:shadow-md",
          ].join(" ")}
        />
      </div>

      {/* End labels */}
      <div className="mt-2 flex justify-between">
        <span
          className="text-xs font-medium text-muted-foreground transition-all duration-150"
          style={{
            opacity: value > 0 && value < 2 ? 1 : 0.45,
            transform: `scale(${value > 0 && value < 2 ? 1.1 : 1})`,
            transformOrigin: "left center",
          }}
        >
          Berbat
        </span>
        <span
          className="text-xs font-medium text-muted-foreground transition-all duration-150"
          style={{
            opacity: value > 8 ? 1 : 0.45,
            transform: `scale(${value > 8 ? 1.1 : 1})`,
            transformOrigin: "right center",
          }}
        >
          Mükemmel
        </span>
      </div>
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
            {requestedDate} tarihinde {requestedTime}
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
            <Label>Puan</Label>
            <RatingSlider value={rating} onChange={setRating} />
            {rating === 0 && state.message?.includes("Rating") && (
              <p className="text-sm text-destructive">Lütfen bir puan seçin</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`comment-${appointmentId || reviewId}`}>
              Yorum (isteğe bağlı)
            </Label>
            <Textarea
              id={`comment-${appointmentId || reviewId}`}
              name="comment"
              placeholder="Deneyiminizi paylaşın..."
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
                  {isEdit ? "Güncelleniyor..." : "Gönderiliyor..."}
                </>
              ) : isEdit ? (
                "Yorumu güncelle"
              ) : (
                "Yorum gönder"
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
                İptal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
