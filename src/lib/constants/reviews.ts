import type { ReviewStatus } from "@/generated/prisma/enums";

export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MAX_COMMENT_LENGTH = 1000;

export const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  HIDDEN: "Hidden",
  REMOVED: "Removed",
};

export const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  HIDDEN: "bg-gray-100 text-gray-800",
  REMOVED: "bg-red-100 text-red-800",
};

/** Statuses that allow the customer to edit their review */
export const EDITABLE_STATUSES: ReviewStatus[] = ["APPROVED", "PENDING"];
