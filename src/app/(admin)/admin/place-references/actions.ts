"use server";

import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { ADMIN_PLACE_REFERENCE_TRANSITIONS } from "@/lib/constants/place-reference";
import type { PlaceReferenceStatus } from "@/generated/prisma/enums";

export type PlaceReferenceActionState = {
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
        targetType: "PlaceReference",
        targetId,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}

function revalidatePlaceReferences() {
  revalidatePath("/admin/place-references");
}

// ─── Status Update ──────────────────────────────────────────────

const updateStatusSchema = z.object({
  placeReferenceId: z.string().min(1),
  newStatus: z.enum([
    "DISCOVERED",
    "APPROVED",
    "HIDDEN",
    "DUPLICATE",
    "CLAIM_PENDING",
    "CLAIMED",
    "REJECTED",
    "STALE",
    "ERROR",
  ]),
});

export async function updatePlaceReferenceStatus(
  placeReferenceId: string,
  newStatus: PlaceReferenceStatus
): Promise<PlaceReferenceActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = updateStatusSchema.safeParse({ placeReferenceId, newStatus });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const record = await db.placeReference.findUnique({
    where: { id: placeReferenceId },
    select: { status: true },
  });

  if (!record) {
    return { success: false, message: "Place reference not found." };
  }

  const allowed = ADMIN_PLACE_REFERENCE_TRANSITIONS[record.status as PlaceReferenceStatus];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Cannot transition from ${record.status} to ${newStatus}.`,
    };
  }

  await db.placeReference.update({
    where: { id: placeReferenceId },
    data: { status: newStatus },
  });

  await logAdminAction(
    admin.id,
    "placeReference.update_status",
    placeReferenceId,
    `${record.status} → ${newStatus}`
  );

  revalidatePlaceReferences();
  return { success: true, message: `Status updated to ${newStatus}.` };
}

// ─── Metadata Update ────────────────────────────────────────────

const updateMetadataSchema = z.object({
  placeReferenceId: z.string().min(1),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  categoryHint: z.string().max(100).optional(),
});

export async function updatePlaceReferenceMetadata(
  placeReferenceId: string,
  fields: { city?: string; district?: string; categoryHint?: string }
): Promise<PlaceReferenceActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = updateMetadataSchema.safeParse({ placeReferenceId, ...fields });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const record = await db.placeReference.findUnique({
    where: { id: placeReferenceId },
    select: { id: true },
  });

  if (!record) {
    return { success: false, message: "Place reference not found." };
  }

  // Empty string → null normalization
  const city = fields.city?.trim() || null;
  const district = fields.district?.trim() || null;
  const categoryHint = fields.categoryHint?.trim() || null;

  await db.placeReference.update({
    where: { id: placeReferenceId },
    data: { city, district, categoryHint },
  });

  await logAdminAction(
    admin.id,
    "placeReference.update_metadata",
    placeReferenceId,
    `city=${city}, district=${district}, categoryHint=${categoryHint}`
  );

  revalidatePlaceReferences();
  return { success: true, message: "Metadata updated." };
}

// ─── Link / Unlink Business ─────────────────────────────────────

const linkBusinessSchema = z.object({
  placeReferenceId: z.string().min(1),
  businessId: z.string().min(1),
});

export async function linkPlaceReferenceToBusiness(
  placeReferenceId: string,
  businessId: string
): Promise<PlaceReferenceActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = linkBusinessSchema.safeParse({ placeReferenceId, businessId });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const [record, business] = await Promise.all([
    db.placeReference.findUnique({
      where: { id: placeReferenceId },
      select: { id: true, claimedBusinessId: true },
    }),
    db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    }),
  ]);

  if (!record) {
    return { success: false, message: "Place reference not found." };
  }
  if (!business) {
    return { success: false, message: "Business not found." };
  }
  if (record.claimedBusinessId) {
    return {
      success: false,
      message: "Already linked to a business. Unlink first.",
    };
  }

  await db.placeReference.update({
    where: { id: placeReferenceId },
    data: { claimedBusinessId: businessId },
  });

  await logAdminAction(
    admin.id,
    "placeReference.link_business",
    placeReferenceId,
    `linked to Business ${businessId} (${business.name})`
  );

  revalidatePlaceReferences();
  return { success: true, message: `Linked to "${business.name}".` };
}

const unlinkSchema = z.object({
  placeReferenceId: z.string().min(1),
});

export async function unlinkPlaceReferenceFromBusiness(
  placeReferenceId: string
): Promise<PlaceReferenceActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = unlinkSchema.safeParse({ placeReferenceId });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const record = await db.placeReference.findUnique({
    where: { id: placeReferenceId },
    select: { id: true, claimedBusinessId: true },
  });

  if (!record) {
    return { success: false, message: "Place reference not found." };
  }
  if (!record.claimedBusinessId) {
    return { success: false, message: "Not linked to any business." };
  }

  await db.placeReference.update({
    where: { id: placeReferenceId },
    data: { claimedBusinessId: null },
  });

  await logAdminAction(
    admin.id,
    "placeReference.unlink_business",
    placeReferenceId,
    `unlinked from Business ${record.claimedBusinessId}`
  );

  revalidatePlaceReferences();
  return { success: true, message: "Business link removed." };
}
