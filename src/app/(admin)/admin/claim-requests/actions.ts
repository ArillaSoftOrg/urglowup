"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export type ClaimRequestActionState = {
  success: boolean;
  message?: string;
};

async function logAdminAction(
  adminId: string,
  action: string,
  targetId: string,
  details?: string
) {
  try {
    await db.adminAction.create({
      data: {
        adminId,
        action,
        targetType: "BusinessClaimRequest",
        targetId,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}

const rejectSchema = z.object({
  claimRequestId: z.string().min(1),
  rejectionReason: z.string().trim().min(1).max(500),
});

export async function rejectClaimRequest(
  claimRequestId: string,
  rejectionReason: string
): Promise<ClaimRequestActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = rejectSchema.safeParse({ claimRequestId, rejectionReason });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  // Atomic: only a still-PENDING request can be rejected.
  const res = await db.businessClaimRequest.updateMany({
    where: { id: parsed.data.claimRequestId, status: "PENDING" },
    data: {
      status: "REJECTED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectionReason: parsed.data.rejectionReason,
    },
  });

  if (res.count !== 1) {
    return { success: false, message: "Başvuru artık reddedilebilir durumda değil." };
  }

  await logAdminAction(
    admin.id,
    "claimRequest.reject",
    parsed.data.claimRequestId,
    parsed.data.rejectionReason
  );

  revalidatePath("/admin/claim-requests");
  return { success: true, message: "Başvuru reddedildi." };
}
