import type { ReviewStatus } from "@urglowup/db";

export const MAX_COMMENT_LENGTH = 1000;

/** Statuses that allow the customer to edit their review. */
export const EDITABLE_STATUSES: ReviewStatus[] = ["APPROVED", "PENDING"];
