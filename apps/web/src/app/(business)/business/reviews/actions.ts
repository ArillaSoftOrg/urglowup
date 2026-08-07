"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireBusiness } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  replyToReview as replyToReviewForBusiness,
  deleteReviewReply as deleteReviewReplyForBusiness,
} from "@urglowup/domain/reviews";

const replySchema = z.object({
  reply: z.string().min(1, "Yanıt boş olamaz").max(1000, "En fazla 1000 karakter"),
});

export type ReviewReplyState =
  | { success: true }
  | { success: false; error: string };

export async function replyToReview(
  reviewId: string,
  _prev: ReviewReplyState,
  formData: FormData
): Promise<ReviewReplyState> {
  const { businessId } = await requireBusiness("MANAGER");

  const rateLimit = await enforceRateLimit({
    scope: "review",
    headers: await headers(),
    subjectId: businessId,
    ipLimit: 30,
    subjectLimit: 15,
  });
  if (!rateLimit.ok) {
    return { success: false, error: rateLimit.message };
  }

  const result = replySchema.safeParse({ reply: formData.get("reply") });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const reply = await replyToReviewForBusiness(businessId, reviewId, result.data.reply);
  if (!reply.ok) {
    return { success: false, error: "Yorum bulunamadı." };
  }

  revalidatePath("/business/reviews");

  return { success: true };
}

export async function deleteReviewReply(
  reviewId: string
): Promise<ReviewReplyState> {
  const { businessId } = await requireBusiness("MANAGER");

  const result = await deleteReviewReplyForBusiness(businessId, reviewId);
  if (!result.ok) {
    return { success: false, error: "Yorum bulunamadı." };
  }

  revalidatePath("/business/reviews");

  return { success: true };
}
