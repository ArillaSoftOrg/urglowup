"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

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

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { businessId: true, status: true },
  });

  if (!review || review.businessId !== businessId) {
    return { success: false, error: "Yorum bulunamadı." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: {
      businessReply: result.data.reply,
      businessReplyAt: new Date(),
    },
  });

  revalidatePath("/business/reviews");

  return { success: true };
}

export async function deleteReviewReply(
  reviewId: string
): Promise<ReviewReplyState> {
  const { businessId } = await requireBusiness("MANAGER");

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { businessId: true },
  });

  if (!review || review.businessId !== businessId) {
    return { success: false, error: "Yorum bulunamadı." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { businessReply: null, businessReplyAt: null },
  });

  revalidatePath("/business/reviews");

  return { success: true };
}
