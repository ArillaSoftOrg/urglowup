"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MessageSquare, MoreHorizontal, Star } from "lucide-react";
import Link from "next/link";
import { ReasonGate } from "./reason-gate";
import {
  adminApproveReview,
  adminHideReview,
  adminRemoveReview,
  adminRestoreReview,
} from "@/app/(admin)/admin/actions";
import type { AdminReview } from "@/lib/queries/admin";

import type { BadgeVariant } from "@/components/ui/badge";

const REVIEW_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  HIDDEN: "neutral",
  REMOVED: "destructive",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  const filledStars = Math.round(rating / 2);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3 ${
            i < filledStars
              ? "fill-rating text-rating"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: AdminReview }) {
  const [isPending, startTransition] = useTransition();
  const [actionInProgress, setActionInProgress] = useState<"hide" | "remove" | null>(null);

  function handleApprove() {
    startTransition(async () => {
      await adminApproveReview(review.id);
    });
  }

  async function handleHide(reason: string) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await adminHideReview(review.id, reason);
        setActionInProgress(null);
        resolve();
      });
    });
  }

  async function handleRemove(reason: string) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await adminRemoveReview(review.id, reason);
        setActionInProgress(null);
        resolve();
      });
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await adminRestoreReview(review.id);
    });
  }

  const customerName = [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .join(" ");

  if (actionInProgress) {
    return (
      <div className="border-b p-3 last:border-0">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-900">{review.business.name}</p>
            <p className="text-xs text-slate-600">{customerName || "Customer"}</p>
          </div>
          <button
            onClick={() => setActionInProgress(null)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
        <ReasonGate
          onConfirm={actionInProgress === "hide" ? handleHide : handleRemove}
          onCancel={() => setActionInProgress(null)}
          actionLabel={actionInProgress === "hide" ? "Hide" : "Remove"}
          isPending={isPending}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 border-b p-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StarRating rating={review.rating} />
          <Badge variant={REVIEW_STATUS_VARIANT[review.status] ?? "neutral"} className="text-xs">
            {review.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
          </span>
        </div>
        {review.comment && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {review.comment}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {customerName || "Customer"}
          </span>
          {" → "}
          <Link
            href={`/admin/businesses/${review.business.id}`}
            className="hover:underline"
          >
            {review.business.name}
          </Link>
          {" · "}
          <Link
            href={`/b/${review.business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            View page ↗
          </Link>
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 shrink-0" />}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {review.status === "PENDING" && (
            <>
              <DropdownMenuItem onClick={handleApprove}>
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActionInProgress("hide")}>
                Hide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActionInProgress("remove")}
                className="text-destructive focus:text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </>
          )}
          {review.status === "APPROVED" && (
            <>
              <DropdownMenuItem onClick={() => setActionInProgress("hide")}>
                Hide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActionInProgress("remove")}
                className="text-destructive focus:text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </>
          )}
          {review.status === "HIDDEN" && (
            <>
              <DropdownMenuItem onClick={handleRestore}>
                Restore (Approve)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActionInProgress("remove")}
                className="text-destructive focus:text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </>
          )}
          {review.status === "REMOVED" && (
            <DropdownMenuItem onClick={handleRestore}>
              Restore (Approve)
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ReviewModerationTable({ reviews }: { reviews: AdminReview[] }) {
  const pending = reviews.filter((r) => r.status === "PENDING");
  const approved = reviews.filter((r) => r.status === "APPROVED");
  const hidden = reviews.filter((r) => r.status === "HIDDEN");
  const removed = reviews.filter((r) => r.status === "REMOVED");

  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="all">All ({reviews.length})</TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({pending.length})
        </TabsTrigger>
        <TabsTrigger value="approved">
          Approved ({approved.length})
        </TabsTrigger>
        <TabsTrigger value="hidden">Hidden ({hidden.length})</TabsTrigger>
        <TabsTrigger value="removed">Removed ({removed.length})</TabsTrigger>
      </TabsList>

      {[
        { value: "all", items: reviews },
        { value: "pending", items: pending },
        { value: "approved", items: approved },
        { value: "hidden", items: hidden },
        { value: "removed", items: removed },
      ].map(({ value, items }) => (
        <TabsContent key={value} value={value} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <MessageSquare className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No reviews found
                  </p>
                </div>
              ) : (
                items.map((r) => <ReviewRow key={r.id} review={r} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
