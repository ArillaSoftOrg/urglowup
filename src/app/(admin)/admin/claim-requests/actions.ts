"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { UserRole, BusinessMemberRole, MembershipStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { invalidateCache } from "@/lib/cache";

export type ClaimRequestActionState = {
  success: boolean;
  message?: string;
};

class ApproveError extends Error {}

function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2002"
  );
}

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

const approveSchema = z.object({
  claimRequestId: z.string().min(1),
});

export async function approveClaimRequest(
  claimRequestId: string
): Promise<ClaimRequestActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = approveSchema.safeParse({ claimRequestId });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const id = parsed.data.claimRequestId;

  // ─── Pre-transaction guards (early UX) ───
  const claim = await db.businessClaimRequest.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true, businessId: true, placeReferenceId: true },
  });
  if (!claim) {
    return { success: false, message: "Başvuru bulunamadı." };
  }
  if (claim.status !== "PENDING") {
    return { success: false, message: "Başvuru artık onaylanabilir durumda değil." };
  }
  let businessId = claim.businessId;
  if (!businessId && claim.placeReferenceId) {
    const placeReference = await db.placeReference.findUnique({
      where: { id: claim.placeReferenceId },
      select: { claimedBusinessId: true },
    });
    if (!placeReference) {
      return { success: false, message: "Yer referansı bulunamadı." };
    }
    if (placeReference.claimedBusinessId === null) {
      return {
        success: false,
        message:
          "Bu başvuru henüz bir Business'a bağlı değil. Önce PlaceReference'ı Business'a dönüştürün.",
      };
    }
    businessId = placeReference.claimedBusinessId;
  }
  if (!businessId) {
    return { success: false, message: "Bu başvuru bir işletmeye veya yer referansına bağlı değil." };
  }

  const userId = claim.userId;

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, slug: true },
  });
  if (!business) {
    return { success: false, message: "İşletme bulunamadı." };
  }
  if (business.ownerId !== null) {
    return { success: false, message: "İşletmenin zaten bir sahibi var." };
  }

  const existingOwnerMember = await db.businessMember.findFirst({
    where: { businessId, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
    select: { userId: true },
  });
  if (existingOwnerMember) {
    return { success: false, message: "Bu işletmede zaten aktif bir sahip üye var." };
  }

  const [memberBusiness, legacyBusiness] = await Promise.all([
    db.businessMember.findFirst({
      where: { userId, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
      select: { businessId: true },
    }),
    db.business.findFirst({ where: { ownerId: userId }, select: { id: true } }),
  ]);
  if (memberBusiness || legacyBusiness) {
    return { success: false, message: "Başvuran kullanıcı zaten başka bir işletmenin sahibidir." };
  }

  // ─── Transaction (atomic, race-safe) ───
  try {
    await db.$transaction(async (tx) => {
      const locked = await tx.businessClaimRequest.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: "APPROVED",
          businessId,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      if (locked.count !== 1) {
        throw new ApproveError("Başvuru artık onaylanabilir durumda değil.");
      }

      const freshBiz = await tx.business.findUnique({
        where: { id: businessId },
        select: {
          ownerId: true,
          status: true,
          isMarketplaceVisible: true,
          marketplaceJoinedAt: true,
        },
      });
      if (!freshBiz || freshBiz.ownerId !== null) {
        throw new ApproveError("İşletmenin zaten bir sahibi var.");
      }

      const ownerMember = await tx.businessMember.findFirst({
        where: { businessId, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
        select: { userId: true },
      });
      if (ownerMember) {
        throw new ApproveError("Bu işletmede zaten aktif bir sahip üye var.");
      }

      const [m, l] = await Promise.all([
        tx.businessMember.findFirst({
          where: { userId, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
          select: { businessId: true },
        }),
        tx.business.findFirst({ where: { ownerId: userId }, select: { id: true } }),
      ]);
      if (m || l) {
        throw new ApproveError("Başvuran kullanıcı zaten başka bir işletmenin sahibidir.");
      }

      await tx.business.update({
        where: { id: businessId },
        data: {
          ownerId: userId,
          ownershipStatus: "CLAIMED",
          ...(freshBiz.status === "ACTIVE_MARKETPLACE" &&
            freshBiz.isMarketplaceVisible &&
            freshBiz.marketplaceJoinedAt === null && {
              marketplaceJoinedAt: new Date(),
            }),
        },
      });
      await tx.businessMember.upsert({
        where: { businessId_userId: { businessId, userId } },
        create: {
          businessId,
          userId,
          role: BusinessMemberRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
        update: { role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
      });
      await tx.user.update({
        where: { id: userId },
        data: { role: UserRole.BUSINESS_OWNER },
      });
      // PlaceReference DEĞİŞMEZ (Phase 4C'de CLAIMED + linked).
    });
  } catch (err) {
    if (err instanceof ApproveError) {
      return { success: false, message: err.message };
    }
    if (isPrismaUniqueError(err)) {
      return { success: false, message: "Başvuran kullanıcı zaten başka bir işletmenin sahibidir." };
    }
    throw err;
  }

  await logAdminAction(
    admin.id,
    "claim.approve",
    id,
    `business=${businessId} user=${userId}`
  );

  revalidatePath("/admin/claim-requests");
  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath(`/b/${business.slug}`);
  revalidatePath("/");
  revalidatePath("/explore");
  await invalidateCache(`business:v2:slug:${business.slug}`);
  revalidatePath("/admin/place-references");
  return { success: true, message: "Başvuru onaylandı, işletme sahibi atandı." };
}
