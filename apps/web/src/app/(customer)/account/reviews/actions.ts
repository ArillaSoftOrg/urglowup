"use server";

import { getCurrentUser } from "@/lib/auth";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { headers } from "next/headers";
import { enforceRateLimit } from "@/lib/rate-limit";
import { MAX_COMMENT_LENGTH } from "@/lib/constants/reviews";
import { env } from "@/lib/env";
import { isSuspended } from "@/lib/admin/user-suspension";
import { notifyBusinessReviewReceived } from "@/lib/in-app-notifications";
import {
  submitReview as submitReviewForCustomer,
  updateReview as updateReviewForCustomer,
  removeReview as removeReviewForCustomer,
} from "@urglowup/domain/reviews";

export type ReviewActionState = {
  success: boolean;
  message?: string;
};

const submitSchema = z.object({
  appointmentId: z.string().min(1, "Appointment is required"),
  rating: z.coerce.number().min(0.1, "Rating is required").max(10),
  comment: z
    .string()
    .max(MAX_COMMENT_LENGTH, `Comment must be under ${MAX_COMMENT_LENGTH} characters`)
    .optional()
    .or(z.literal("")),
});

const updateSchema = z.object({
  reviewId: z.string().min(1),
  rating: z.coerce.number().min(0.1, "Rating is required").max(10),
  comment: z
    .string()
    .max(MAX_COMMENT_LENGTH, `Comment must be under ${MAX_COMMENT_LENGTH} characters`)
    .optional()
    .or(z.literal("")),
});

function revalidateReviewPaths(slug: string | null) {
  revalidatePath("/account/reviews");
  revalidatePath("/account/appointments");
  if (slug) {
    revalidatePath(`/b/${slug}`);
  }
}

// ─── Submit Review ─────────────────────────────────────────────

export async function submitReview(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated." };
  }

  if (isSuspended(user)) {
    return { success: false, message: "Your account is suspended. Please contact support." };
  }

  const rateLimit = await enforceRateLimit({
    scope: "review",
    headers: await headers(),
    subjectId: user.id,
    ipLimit: 30,
    subjectLimit: 15,
  });
  if (!rateLimit.ok) {
    return { success: false, message: rateLimit.message };
  }

  const result = submitSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const submission = await submitReviewForCustomer({
    customerId: user.id,
    appointmentId: result.data.appointmentId,
    rating: result.data.rating,
    comment: result.data.comment || null,
    moderationMode: env.REVIEW_MODERATION_MODE,
  });

  if (!submission.ok) {
    const messages: Record<typeof submission.reason, string> = {
      APPOINTMENT_NOT_FOUND: "Appointment not found.",
      NOT_COMPLETED: "You can only review completed appointments.",
      ALREADY_REVIEWED: "You have already reviewed this appointment.",
    };
    return { success: false, message: messages[submission.reason] };
  }

  revalidateReviewPaths(submission.businessSlug);

  after(async () => {
    try {
      await notifyBusinessReviewReceived(submission.reviewId);
    } catch (err) {
      console.error("[in-app] submitReview → business:", err);
    }
  });

  return { success: true, message: "Review submitted!" };
}

// ─── Update Review ─────────────────────────────────────────────

export async function updateReview(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated." };
  }

  const rateLimit = await enforceRateLimit({
    scope: "review",
    headers: await headers(),
    subjectId: user.id,
    ipLimit: 30,
    subjectLimit: 15,
  });
  if (!rateLimit.ok) {
    return { success: false, message: rateLimit.message };
  }

  const result = updateSchema.safeParse({
    reviewId: formData.get("reviewId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const update = await updateReviewForCustomer({
    customerId: user.id,
    reviewId: result.data.reviewId,
    rating: result.data.rating,
    comment: result.data.comment || null,
  });

  if (!update.ok) {
    const messages: Record<typeof update.reason, string> = {
      NOT_FOUND: "Review not found.",
      NOT_EDITABLE_SOURCE: "Cannot edit this review.",
      NOT_EDITABLE_STATUS: "This review can no longer be edited.",
    };
    return { success: false, message: messages[update.reason] };
  }

  revalidateReviewPaths(update.businessSlug);

  return { success: true, message: "Review updated." };
}

// ─── Remove Review (Soft Delete) ───────────────────────────────

export async function removeReview(
  reviewId: string
): Promise<ReviewActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated." };
  }

  const removal = await removeReviewForCustomer(user.id, reviewId);

  if (!removal.ok) {
    const messages: Record<typeof removal.reason, string> = {
      NOT_FOUND: "Review not found.",
      NOT_REMOVABLE_SOURCE: "Cannot remove this review.",
    };
    return { success: false, message: messages[removal.reason] };
  }

  revalidateReviewPaths(removal.businessSlug);

  return { success: true, message: "Review removed." };
}
