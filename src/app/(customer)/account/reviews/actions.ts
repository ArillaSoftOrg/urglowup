"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { EDITABLE_STATUSES, MAX_COMMENT_LENGTH } from "@/lib/constants/reviews";
import { getGlobalAverage, recalculateBusinessStats } from "@/lib/ratings/calculator";
import { env } from "@/lib/env";
import { isSuspended } from "@/lib/admin/user-suspension";
import { notifyBusinessReviewReceived } from "@/lib/in-app-notifications";

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

async function getBusinessSlug(businessId: string): Promise<string | null> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { slug: true },
  });
  return business?.slug ?? null;
}

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

  const result = submitSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { appointmentId, rating, comment } = result.data;

  // Verify appointment ownership and COMPLETED status
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { customerId: true, status: true, businessId: true },
  });

  if (!appointment || appointment.customerId !== user.id) {
    return { success: false, message: "Appointment not found." };
  }

  if (appointment.status !== "COMPLETED") {
    return {
      success: false,
      message: "You can only review completed appointments.",
    };
  }

  // Check no existing review for this appointment
  const existing = await db.review.findUnique({
    where: { appointmentId },
    select: { id: true },
  });

  if (existing) {
    return {
      success: false,
      message: "You have already reviewed this appointment.",
    };
  }

  // Appointment-linked reviews get full trust weight; unlinked get reduced weight
  const trustWeight = appointmentId ? 1.0 : 0.75;

  // Feature flag: REVIEW_MODERATION_MODE controls whether reviews are auto-approved or pending
  const reviewStatus = env.REVIEW_MODERATION_MODE === "pending" ? "PENDING" : "APPROVED";

  await db.review.create({
    data: {
      businessId: appointment.businessId,
      customerId: user.id,
      appointmentId,
      rating,
      trustWeight,
      comment: comment || null,
      source: "URGLOWUP",
      status: reviewStatus,
    },
  });

  const globalAvg = await getGlobalAverage();
  await recalculateBusinessStats(appointment.businessId, globalAvg);

  const slug = await getBusinessSlug(appointment.businessId);
  revalidateReviewPaths(slug);

  const createdReview = await db.review.findUnique({
    where: { appointmentId },
    select: { id: true },
  });

  if (createdReview) {
    after(async () => {
      try {
        await notifyBusinessReviewReceived(createdReview.id);
      } catch (err) {
        console.error("[in-app] submitReview → business:", err);
      }
    });
  }

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

  const result = updateSchema.safeParse({
    reviewId: formData.get("reviewId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { reviewId, rating, comment } = result.data;

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { customerId: true, source: true, status: true, businessId: true },
  });

  if (!review || review.customerId !== user.id) {
    return { success: false, message: "Review not found." };
  }

  if (review.source !== "URGLOWUP") {
    return { success: false, message: "Cannot edit this review." };
  }

  if (!EDITABLE_STATUSES.includes(review.status)) {
    return {
      success: false,
      message: "This review can no longer be edited.",
    };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { rating, comment: comment || null },
  });

  const globalAvg = await getGlobalAverage();
  await recalculateBusinessStats(review.businessId, globalAvg);

  const slug = await getBusinessSlug(review.businessId);
  revalidateReviewPaths(slug);

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

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { customerId: true, source: true, businessId: true },
  });

  if (!review || review.customerId !== user.id) {
    return { success: false, message: "Review not found." };
  }

  if (review.source !== "URGLOWUP") {
    return { success: false, message: "Cannot remove this review." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "REMOVED" },
  });

  const globalAvg = await getGlobalAverage();
  await recalculateBusinessStats(review.businessId, globalAvg);

  const slug = await getBusinessSlug(review.businessId);
  revalidateReviewPaths(slug);

  return { success: true, message: "Review removed." };
}
