import { db } from "@urglowup/db";
import { getGlobalAverage, recalculateBusinessStats } from "./rating-calculator";
import { EDITABLE_STATUSES } from "./constants";

async function getBusinessSlug(businessId: string): Promise<string | null> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { slug: true },
  });
  return business?.slug ?? null;
}

async function refreshBusinessRating(businessId: string): Promise<void> {
  const globalAvg = await getGlobalAverage();
  await recalculateBusinessStats(businessId, globalAvg);
}

export interface SubmitReviewInput {
  customerId: string;
  appointmentId: string;
  rating: number;
  comment: string | null;
  /** Whether new reviews require moderation before becoming visible. */
  moderationMode: "approved" | "pending";
}

export type SubmitReviewResult =
  | { ok: true; reviewId: string; businessId: string; businessSlug: string | null }
  | { ok: false; reason: "APPOINTMENT_NOT_FOUND" | "NOT_COMPLETED" | "ALREADY_REVIEWED" };

export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const appointment = await db.appointment.findUnique({
    where: { id: input.appointmentId },
    select: { customerId: true, status: true, businessId: true },
  });

  if (!appointment || appointment.customerId !== input.customerId) {
    return { ok: false, reason: "APPOINTMENT_NOT_FOUND" };
  }
  if (appointment.status !== "COMPLETED") {
    return { ok: false, reason: "NOT_COMPLETED" };
  }

  const existing = await db.review.findUnique({
    where: { appointmentId: input.appointmentId },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, reason: "ALREADY_REVIEWED" };
  }

  const review = await db.review.create({
    data: {
      businessId: appointment.businessId,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      rating: input.rating,
      // Appointment-linked reviews get full trust weight.
      trustWeight: 1.0,
      comment: input.comment,
      source: "URGLOWUP",
      status: input.moderationMode === "pending" ? "PENDING" : "APPROVED",
    },
    select: { id: true },
  });

  await refreshBusinessRating(appointment.businessId);
  const businessSlug = await getBusinessSlug(appointment.businessId);

  return { ok: true, reviewId: review.id, businessId: appointment.businessId, businessSlug };
}

export interface UpdateReviewInput {
  customerId: string;
  reviewId: string;
  rating: number;
  comment: string | null;
}

export type UpdateReviewResult =
  | { ok: true; businessId: string; businessSlug: string | null }
  | { ok: false; reason: "NOT_FOUND" | "NOT_EDITABLE_SOURCE" | "NOT_EDITABLE_STATUS" };

export async function updateReview(input: UpdateReviewInput): Promise<UpdateReviewResult> {
  const review = await db.review.findUnique({
    where: { id: input.reviewId },
    select: { customerId: true, source: true, status: true, businessId: true },
  });

  if (!review || review.customerId !== input.customerId) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (review.source !== "URGLOWUP") {
    return { ok: false, reason: "NOT_EDITABLE_SOURCE" };
  }
  if (!EDITABLE_STATUSES.includes(review.status)) {
    return { ok: false, reason: "NOT_EDITABLE_STATUS" };
  }

  await db.review.update({
    where: { id: input.reviewId },
    data: { rating: input.rating, comment: input.comment },
  });

  await refreshBusinessRating(review.businessId);
  const businessSlug = await getBusinessSlug(review.businessId);

  return { ok: true, businessId: review.businessId, businessSlug };
}

export type RemoveReviewResult =
  | { ok: true; businessId: string; businessSlug: string | null }
  | { ok: false; reason: "NOT_FOUND" | "NOT_REMOVABLE_SOURCE" };

export async function removeReview(
  customerId: string,
  reviewId: string,
): Promise<RemoveReviewResult> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { customerId: true, source: true, businessId: true },
  });

  if (!review || review.customerId !== customerId) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (review.source !== "URGLOWUP") {
    return { ok: false, reason: "NOT_REMOVABLE_SOURCE" };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "REMOVED" },
  });

  await refreshBusinessRating(review.businessId);
  const businessSlug = await getBusinessSlug(review.businessId);

  return { ok: true, businessId: review.businessId, businessSlug };
}

export type ReplyToReviewResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" };

export async function replyToReview(
  businessId: string,
  reviewId: string,
  reply: string,
): Promise<ReplyToReviewResult> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { businessId: true },
  });
  if (!review || review.businessId !== businessId) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { businessReply: reply, businessReplyAt: new Date() },
  });

  return { ok: true };
}

export async function deleteReviewReply(
  businessId: string,
  reviewId: string,
): Promise<ReplyToReviewResult> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { businessId: true },
  });
  if (!review || review.businessId !== businessId) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { businessReply: null, businessReplyAt: null },
  });

  return { ok: true };
}
