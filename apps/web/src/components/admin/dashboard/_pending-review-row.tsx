"use client";

import { useTransition, useState } from "react";
import { format } from "date-fns";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminApproveReview,
  adminHideReview,
} from "@/app/(admin)/admin/actions";
import type { AdminDashboardMetrics } from "@/lib/queries/admin";

interface PendingReviewRowProps {
  review: AdminDashboardMetrics["pendingReviewQueue"][number];
}

export function PendingReviewRow({ review }: PendingReviewRowProps) {
  const [isPending, startTransition] = useTransition();
  const [showHideReasonForm, setShowHideReasonForm] = useState(false);
  const [hideReason, setHideReason] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      await adminApproveReview(review.id);
    });
  };

  const handleHide = () => {
    setShowHideReasonForm(true);
  };

  const handleSubmitHide = () => {
    if (!hideReason.trim()) {
      alert("Please enter a reason.");
      return;
    }
    startTransition(async () => {
      await adminHideReview(review.id, hideReason);
      setShowHideReasonForm(false);
      setHideReason("");
    });
  };

  const starCount = Math.round(review.rating / 2);

  if (showHideReasonForm) {
    return (
      <div className="rounded-lg border border-border bg-slate-50 p-3 text-sm">
        <p className="text-xs font-medium mb-3">Why are you hiding this review?</p>
        <textarea
          value={hideReason}
          onChange={(e) => setHideReason(e.target.value)}
          placeholder="Reason (required)"
          maxLength={500}
          disabled={isPending}
          className="w-full rounded border border-slate-300 p-2 text-xs placeholder-slate-500 disabled:bg-slate-100 mb-2"
          rows={2}
        />
        <div className="flex gap-2">
          <Button
            size="xs"
            onClick={handleSubmitHide}
            disabled={isPending || !hideReason.trim()}
          >
            {isPending ? <Loader2 className="size-3 animate-spin" /> : "Hide"}
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setShowHideReasonForm(false);
              setHideReason("");
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between rounded-lg border border-border p-3 text-sm">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${
                  i < starCount
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {review.customer.firstName} {review.customer.lastName} →{" "}
            {review.business.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
          {review.comment || "(no comment)"}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(review.createdAt), "MMM d")}
        </p>
      </div>
      <div className="flex gap-2 ml-2">
        <Button
          size="xs"
          variant="outline"
          onClick={handleApprove}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            "Approve"
          )}
        </Button>
        <Button
          size="xs"
          variant="secondary"
          onClick={handleHide}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            "Hide"
          )}
        </Button>
      </div>
    </div>
  );
}
