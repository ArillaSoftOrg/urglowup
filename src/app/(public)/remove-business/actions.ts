"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

export type RemovalRequestActionState = {
  success: boolean;
  message?: string;
};

class RemovalRequestError extends Error {}

const removalRequestSchema = z.object({
  businessId: z.string().min(1),
  contactName: z.string().trim().min(2).max(100),
  relationship: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  verificationType: z.enum([
    "PHONE",
    "EMAIL",
    "DOCUMENT",
    "GOOGLE_BUSINESS_PROFILE",
  ]),
  reason: z.enum([
    "BUSINESS_CLOSED",
    "DUPLICATE",
    "INCORRECT_INFORMATION",
    "NO_CONSENT",
    "OTHER",
  ]),
  explanation: z.string().trim().min(20).max(1000),
  evidenceUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  authorized: z
    .boolean()
    .refine((value) => value, "Yetki beyanını onaylamalısınız."),
});

const REASON_LABELS: Record<
  z.infer<typeof removalRequestSchema>["reason"],
  string
> = {
  BUSINESS_CLOSED: "İşletme kalıcı olarak kapandı",
  DUPLICATE: "Bu sayfa başka bir kaydın tekrarı",
  INCORRECT_INFORMATION: "İşletme bilgileri yanlış veya yanıltıcı",
  NO_CONSENT: "İşletme bu sayfanın yayınlanmasını istemiyor",
  OTHER: "Diğer",
};

export async function submitBusinessRemovalRequest(
  input: z.infer<typeof removalRequestSchema>,
): Promise<RemovalRequestActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Kaldırma talebi için giriş yapmalısınız." };
  }

  const rateLimit = await enforceRateLimit({
    scope: "business-removal",
    headers: await headers(),
    subjectId: user.id,
    ipLimit: 12,
    subjectLimit: 6,
  });
  if (!rateLimit.ok) {
    return { success: false, message: rateLimit.message };
  }

  const parsed = removalRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const business = await tx.business.findUnique({
        where: { id: data.businessId },
        select: {
          id: true,
          name: true,
          ownerId: true,
          ownershipStatus: true,
          status: true,
          isMarketplaceVisible: true,
        },
      });

      if (
        !business ||
        business.ownerId !== null ||
        business.ownershipStatus !== "UNCLAIMED" ||
        business.status !== "ACTIVE_MARKETPLACE" ||
        !business.isMarketplaceVisible
      ) {
        throw new RemovalRequestError(
          "Bu işletme için kaldırma talebi alınamıyor.",
        );
      }

      const existing = await tx.businessClaimRequest.findFirst({
        where: {
          businessId: data.businessId,
          requestType: "REMOVAL",
          status: "PENDING",
        },
        select: { id: true },
      });
      if (existing) {
        throw new RemovalRequestError(
          "Bu işletme için zaten incelenen bir kaldırma talebi var.",
        );
      }

      await tx.businessClaimRequest.create({
        data: {
          userId: user.id,
          businessId: data.businessId,
          requestType: "REMOVAL",
          status: "PENDING",
          verificationType: data.verificationType,
          phone: data.phone?.trim() || null,
          email: data.email.trim(),
          evidenceUrl: data.evidenceUrl?.trim() || null,
          note: [
            `Talep türü: Sayfa kaldırma`,
            `İşletme adı: ${business.name}`,
            `Yetkili kişi: ${data.contactName}`,
            `İşletmeyle ilişkisi: ${data.relationship}`,
            `Kaldırma nedeni: ${REASON_LABELS[data.reason]}`,
            `Açıklama: ${data.explanation.trim()}`,
            "Yetki beyanı: Onaylandı",
          ].join("\n"),
        },
      });
    });
  } catch (error) {
    if (error instanceof RemovalRequestError) {
      return { success: false, message: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/claim-requests");
  return {
    success: true,
    message:
      "Kaldırma talebiniz alındı. Doğrulama tamamlanmadan sayfa yayından kaldırılmaz.",
  };
}
