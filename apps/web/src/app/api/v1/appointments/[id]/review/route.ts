import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { submitReviewBodySchema } from "@urglowup/validation";
import { submitReview } from "@urglowup/domain/reviews";
import { env } from "@/lib/env";
import { notifyBusinessReviewReceived } from "@/lib/in-app-notifications";

interface Params {
  params: Promise<{ id: string }>;
}

const REVIEW_FAILURE_MESSAGES = {
  APPOINTMENT_NOT_FOUND: "Appointment not found.",
  NOT_COMPLETED: "You can only review completed appointments.",
  ALREADY_REVIEWED: "You have already reviewed this appointment.",
} as const;

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "review",
    subjectId: auth.user.id,
    ipLimit: 30,
    subjectLimit: 15,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be JSON.");
  }

  const parsed = submitReviewBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid review.");
  }

  const { id: appointmentId } = await params;
  const result = await submitReview({
    customerId: auth.user.id,
    appointmentId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
    moderationMode: env.REVIEW_MODERATION_MODE,
  });

  if (!result.ok) {
    const status = result.reason === "APPOINTMENT_NOT_FOUND" ? "NOT_FOUND" : "CONFLICT";
    return apiError(status, REVIEW_FAILURE_MESSAGES[result.reason]);
  }

  await notifyBusinessReviewReceived(result.reviewId).catch((err) =>
    console.error("[in-app] review:", err),
  );

  return apiOk({ reviewId: result.reviewId }, 201);
}
