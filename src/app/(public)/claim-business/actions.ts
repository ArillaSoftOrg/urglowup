"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

export type ClaimActionState = {
  success: boolean;
  message?: string;
};

class ClaimError extends Error {}

const submitClaimSchema = z.object({
  placeReferenceId: z.string().min(1),
  businessName: z.string().trim().min(2).max(100),
  contactName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  verificationType: z.enum([
    "PHONE",
    "EMAIL",
    "DOCUMENT",
    "GOOGLE_BUSINESS_PROFILE",
  ]),
  evidenceUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function submitBusinessClaim(
  input: z.infer<typeof submitClaimSchema>
): Promise<ClaimActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Başvuru için giriş yapmalısınız." };
  }

  const rateLimit = await enforceRateLimit({
    scope: "claim",
    headers: await headers(),
    subjectId: user.id,
    ipLimit: 20,
    subjectLimit: 10,
  });
  if (!rateLimit.ok) {
    return { success: false, message: rateLimit.message };
  }

  const parsed = submitClaimSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const extraNote = data.note?.trim();
  const formattedNote =
    `İşletme adı: ${data.businessName}\n` +
    `Yetkili kişi: ${data.contactName}\n` +
    `Ek not: ${extraNote || "-"}`;

  try {
    await db.$transaction(async (tx) => {
      const ref = await tx.placeReference.findUnique({
        where: { id: data.placeReferenceId },
        select: { provider: true, status: true, claimedBusinessId: true },
      });
      if (
        !ref ||
        ref.provider !== "GOOGLE" ||
        ref.status !== "APPROVED" ||
        ref.claimedBusinessId !== null
      ) {
        throw new ClaimError("Bu işletme için başvuru alınamıyor.");
      }

      const dup = await tx.businessClaimRequest.findFirst({
        where: {
          userId: user.id,
          placeReferenceId: data.placeReferenceId,
          status: "PENDING",
        },
        select: { id: true },
      });
      if (dup) {
        throw new ClaimError("Bu işletme için zaten bekleyen bir başvurunuz var.");
      }

      await tx.businessClaimRequest.create({
        data: {
          userId: user.id,
          placeReferenceId: data.placeReferenceId,
          status: "PENDING",
          verificationType: data.verificationType,
          phone: data.phone?.trim() || null,
          email: data.email.trim(),
          evidenceUrl: data.evidenceUrl?.trim() || null,
          note: formattedNote,
        },
      });
    });
  } catch (err) {
    if (err instanceof ClaimError) {
      return { success: false, message: err.message };
    }
    throw err;
  }

  revalidatePath("/admin/claim-requests");
  return {
    success: true,
    message: "Başvurunuz alındı. İnceleme sonrası size dönüş yapılacaktır.",
  };
}
