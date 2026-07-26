"use server";

import { randomBytes } from "crypto";
import { requireRole } from "@/lib/auth";
import { UserRole, BusinessMemberRole, MembershipStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod/v4";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_DASHBOARD_CACHE_TAG } from "@/lib/queries/admin";
import { after } from "next/server";
import {
  ADMIN_STATUS_TRANSITIONS,
  MARKETPLACE_VISIBILITY_FOR_STATUS,
} from "@/lib/constants/business";
import { STATUS_TRANSITIONS } from "@/lib/constants/booking";
import {
  sendConfirmedEmailToCustomer,
  sendRejectedEmailToCustomer,
  sendCancelledByBusinessEmailToCustomer,
  sendAdminCancelledEmailToBusinessOwner,
  sendReviewModeratedEmail,
  sendMediaModeratedEmail,
} from "@/lib/email-notifications";
import { sendReviewRequestWhatsAppToCustomer } from "@/lib/whatsapp-notifications";
import type { BusinessStatus, AppointmentStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { recalculateBusinessStats } from "@/lib/ratings/calculator";
import { invalidateCache } from "@/lib/cache";

export type AdminActionState = {
  success: boolean;
  message?: string;
};

// ─── Logging ───────────────────────────────────────────────────

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: string
): Promise<void> {
  try {
    await db.adminAction.create({
      data: { adminId, action, targetType, targetId, details },
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
  revalidateTag(ADMIN_DASHBOARD_CACHE_TAG, "max");
}

function revalidateAppointmentPaths() {
  revalidatePath("/admin/appointments");
  revalidatePath("/business/appointments");
  revalidatePath("/account/appointments");
}

async function getBusinessSlug(
  businessId: string
): Promise<string | null> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: { slug: true },
  });
  return biz?.slug ?? null;
}

async function revalidateMarketplacePathsForBusiness(
  businessId: string
): Promise<void> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      slug: true,
      city: true,
      district: true,
      categories: {
        select: { category: { select: { slug: true } } },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/explore");

  if (!business) return;

  if (business.slug) {
    await invalidateCache(`business:v2:slug:${business.slug}`);
    revalidatePath(`/b/${business.slug}`);
  }

  for (const bc of business.categories) {
    revalidatePath(`/category/${bc.category.slug}`);
  }

  if (business.city) {
    const encodedCity = encodeURIComponent(business.city);
    revalidatePath(`/city/${encodedCity}`);

    if (business.district) {
      const encodedDistrict = encodeURIComponent(business.district);
      revalidatePath(`/city/${encodedCity}/${encodedDistrict}`);
    }
  }
}

// ─── Appointment Actions ───────────────────────────────────────

const appointmentStatusOverrideSchema = z.object({
  appointmentId: z.string().min(1),
  newStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "REJECTED",
    "CANCELLED_BY_CUSTOMER",
    "CANCELLED_BY_BUSINESS",
    "COMPLETED",
    "NO_SHOW",
  ]),
  adminReason: z.string().min(1, "Reason is required").max(500),
});

export async function adminOverrideAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  adminReason: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = appointmentStatusOverrideSchema.safeParse({
    appointmentId,
    newStatus,
    adminReason,
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true, businessId: true, customerId: true },
  });

  if (!appointment) {
    return { success: false, message: "Appointment not found." };
  }

  const allowed = STATUS_TRANSITIONS[appointment.status as AppointmentStatus];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Cannot change status from ${appointment.status} to ${newStatus}.`,
    };
  }

  const isCancelledOrRejected =
    newStatus === "CANCELLED_BY_BUSINESS" ||
    newStatus === "CANCELLED_BY_CUSTOMER" ||
    newStatus === "REJECTED";

  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: newStatus,
      ...(isCancelledOrRejected ? { cancelledReason: adminReason } : {}),
    },
  });

  // Fire notifications based on the new status
  after(async () => {
    try {
      if (newStatus === "CONFIRMED") {
        await sendConfirmedEmailToCustomer(appointmentId);
      } else if (newStatus === "REJECTED") {
        await sendRejectedEmailToCustomer(appointmentId);
      } else if (newStatus === "CANCELLED_BY_BUSINESS") {
        await sendCancelledByBusinessEmailToCustomer(appointmentId);
      } else if (newStatus === "COMPLETED") {
        await sendReviewRequestWhatsAppToCustomer(appointmentId);
      }
    } catch (err) {
      console.error("[notification] adminOverrideAppointmentStatus:", err);
    }
  });

  await logAdminAction(
    admin.id,
    "appointment.override_status",
    "Appointment",
    appointmentId,
    `${appointment.status} → ${newStatus}, reason: ${adminReason}`
  );

  revalidateAppointmentPaths();
  return {
    success: true,
    message: `Appointment status changed to ${newStatus}.`,
  };
}

const appointmentCancelSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters"),
});

export async function adminCancelAppointment(
  appointmentId: string,
  reason: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = appointmentCancelSchema.safeParse({ appointmentId, reason });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true, businessId: true, customerId: true },
  });

  if (!appointment) {
    return { success: false, message: "Appointment not found." };
  }

  const alreadyCancelled =
    appointment.status === "CANCELLED_BY_CUSTOMER" ||
    appointment.status === "CANCELLED_BY_BUSINESS" ||
    appointment.status === "REJECTED" ||
    appointment.status === "COMPLETED" ||
    appointment.status === "NO_SHOW";

  if (alreadyCancelled) {
    return {
      success: false,
      message: `Appointment is already in a terminal state (${appointment.status}) and cannot be cancelled.`,
    };
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED_BY_BUSINESS",
      cancelledReason: reason,
    },
  });

  after(async () => {
    try {
      await Promise.all([
        sendCancelledByBusinessEmailToCustomer(appointmentId),
        sendAdminCancelledEmailToBusinessOwner(appointmentId, reason),
      ]);
    } catch (err) {
      console.error("[notification] adminCancelAppointment:", err);
    }

    try {
      // Recalculate rating stats in case the appointment had a linked review
      const globalAvg = await db.review
        .aggregate({ _avg: { rating: true }, where: { status: "APPROVED" } })
        .then((r) => r._avg?.rating ?? 0);
      await recalculateBusinessStats(appointment.businessId, globalAvg);
    } catch (err) {
      console.error("[ratings] adminCancelAppointment recalculate:", err);
    }
  });

  await logAdminAction(
    admin.id,
    "appointment.admin_cancel",
    "Appointment",
    appointmentId,
    `Admin cancelled. Reason: ${reason}`
  );

  revalidateAppointmentPaths();
  return { success: true, message: "Appointment cancelled successfully." };
}

export async function adminBulkCancelAppointments(
  appointmentIds: string[],
  adminReason: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  if (!appointmentIds || appointmentIds.length === 0) {
    return { success: false, message: "No appointments selected." };
  }

  if (!adminReason || adminReason.trim().length === 0) {
    return { success: false, message: "Reason is required." };
  }

  if (adminReason.length > 500) {
    return { success: false, message: "Reason must be 500 characters or less." };
  }

  const appointments = await db.appointment.findMany({
    where: {
      id: { in: appointmentIds },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { id: true, status: true, customerId: true },
  });

  if (appointments.length === 0) {
    return {
      success: false,
      message: "No cancelable appointments found. Only PENDING and CONFIRMED appointments can be cancelled.",
    };
  }

  // Update all appointments in a transaction
  await db.$transaction(
    appointments.map((appt) =>
      db.appointment.update({
        where: { id: appt.id },
        data: { status: "CANCELLED_BY_BUSINESS", cancelledReason: adminReason },
      })
    )
  );

  // Fire notifications for all cancelled appointments
  after(async () => {
    try {
      for (const appt of appointments) {
        await sendCancelledByBusinessEmailToCustomer(appt.id);
      }
    } catch (err) {
      console.error("[email] adminBulkCancelAppointments:", err);
    }
  });

  await logAdminAction(
    admin.id,
    "appointment.bulk_cancel",
    "Appointment",
    appointmentIds[0],
    `Cancelled ${appointments.length} appointments, reason: ${adminReason}`
  );

  revalidateAppointmentPaths();
  return {
    success: true,
    message: `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""} cancelled.`,
  };
}

// ─── Business Actions ──────────────────────────────────────────

const updateStatusSchema = z.object({
  businessId: z.string().min(1),
  newStatus: z.enum([
    "ACTIVE_PRIVATE",
    "ACTIVE_MARKETPLACE",
    "SUSPENDED",
    "REJECTED",
  ]),
});

export async function updateBusinessStatus(
  businessId: string,
  newStatus: BusinessStatus
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = updateStatusSchema.safeParse({ businessId, newStatus });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { status: true, slug: true },
  });

  if (!business) {
    return { success: false, message: "Business not found." };
  }

  const allowed = ADMIN_STATUS_TRANSITIONS[business.status];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Cannot change status from ${business.status} to ${newStatus}.`,
    };
  }

  const isMarketplaceVisible = MARKETPLACE_VISIBILITY_FOR_STATUS[newStatus];

  await db.business.update({
    where: { id: businessId },
    data: { status: newStatus, isMarketplaceVisible },
  });

  const actionName =
    newStatus === "REJECTED"
      ? "business.reject"
      : newStatus === "SUSPENDED"
        ? "business.suspend"
        : newStatus === "ACTIVE_PRIVATE"
          ? "business.activate_private"
          : "business.activate_marketplace";

  await logAdminAction(
    admin.id,
    actionName,
    "Business",
    businessId,
    `${business.status} → ${newStatus}`
  );

  revalidateAdmin();
  await revalidateMarketplacePathsForBusiness(businessId);

  return { success: true, message: `Status updated to ${newStatus}.` };
}

export async function toggleMarketplaceVisibility(
  businessId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { status: true, isMarketplaceVisible: true, slug: true },
  });

  if (!business) {
    return { success: false, message: "Business not found." };
  }

  if (business.status !== "ACTIVE_MARKETPLACE") {
    return {
      success: false,
      message:
        "Marketplace visibility can only be toggled for Active (Marketplace) businesses.",
    };
  }

  const newValue = !business.isMarketplaceVisible;

  await db.business.update({
    where: { id: businessId },
    data: { isMarketplaceVisible: newValue },
  });

  await logAdminAction(
    admin.id,
    "business.toggle_marketplace",
    "Business",
    businessId,
    `isMarketplaceVisible: ${business.isMarketplaceVisible} → ${newValue}`
  );

  revalidateAdmin();
  await revalidateMarketplacePathsForBusiness(businessId);
  return {
    success: true,
    message: `Marketplace visibility ${newValue ? "enabled" : "disabled"}.`,
  };
}

const addNoteSchema = z.object({
  businessId: z.string().min(1),
  note: z.string().min(1, "Note cannot be empty").max(2000),
});

export async function adminAddNote(
  businessId: string,
  note: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = addNoteSchema.safeParse({ businessId, note });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });

  if (!business) {
    return { success: false, message: "Business not found." };
  }

  await logAdminAction(
    admin.id,
    "business.admin_note",
    "Business",
    businessId,
    note
  );

  revalidateAdmin();
  return { success: true, message: "Note added successfully." };
}

const addContentNoteSchema = z.object({
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  note: z.string().min(1, "Note cannot be empty").max(2000),
});

export async function adminAddContentNote(
  targetType: string,
  targetId: string,
  note: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = addContentNoteSchema.safeParse({ targetType, targetId, note });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  await logAdminAction(
    admin.id,
    `${targetType.toLowerCase()}.admin_note`,
    targetType,
    targetId,
    note
  );

  revalidateAdmin();
  return { success: true, message: "Note added successfully." };
}

const bulkApproveReviewsSchema = z.object({
  businessId: z.string().min(1),
});

export async function bulkApproveReviews(
  businessId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = bulkApproveReviewsSchema.safeParse({ businessId });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });

  if (!business) {
    return { success: false, message: "Business not found." };
  }

  const pendingReviews = await db.review.findMany({
    where: { businessId, status: "PENDING" },
    select: { id: true },
  });

  if (pendingReviews.length === 0) {
    return { success: true, message: "No pending reviews to approve." };
  }

  await db.review.updateMany({
    where: { businessId, status: "PENDING" },
    data: { status: "APPROVED" },
  });

  await logAdminAction(
    admin.id,
    "business.bulk_approve_reviews",
    "Business",
    businessId,
    `Approved ${pendingReviews.length} review(s)`
  );

  revalidateAdmin();
  revalidatePath(`/admin/businesses/${businessId}`);
  return {
    success: true,
    message: `Approved ${pendingReviews.length} review(s).`,
  };
}

// ─── Admin Business Assign Owner ───────────────────────────────

const adminAssignOwnerSchema = z.object({
  businessId: z.string().min(1),
  userEmail: z.string().email(),
});

export async function adminAssignOwner(
  input: z.infer<typeof adminAssignOwnerSchema>
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = adminAssignOwnerSchema.safeParse(input);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { businessId } = result.data;
  const normalizedEmail = result.data.userEmail.trim().toLowerCase();

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true },
  });

  if (!business) {
    return { success: false, message: "İşletme bulunamadı." };
  }

  if (business.ownerId !== null) {
    return {
      success: false,
      message: "Bu işletmenin zaten sahibi var. Owner transfer bu fazda desteklenmiyor.",
    };
  }

  const existingOwnerMember = await db.businessMember.findFirst({
    where: { businessId, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
    select: { userId: true },
  });

  if (existingOwnerMember) {
    return { success: false, message: "Bu işletmede zaten aktif bir sahip üye var." };
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, role: true },
  });

  if (!user) {
    return { success: false, message: `'${normalizedEmail}' e-postasına sahip kullanıcı bulunamadı.` };
  }

  const [existingMemberBusiness, legacyBusiness] = await Promise.all([
    db.businessMember.findFirst({
      where: { userId: user.id, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
      select: { businessId: true },
    }),
    db.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    }),
  ]);

  if (existingMemberBusiness || legacyBusiness) {
    return { success: false, message: "Bu kullanıcı zaten başka bir işletmenin sahibidir." };
  }

  await db.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: businessId },
      data: { ownerId: user.id, ownershipStatus: "CLAIMED" },
    });
    await tx.businessMember.upsert({
      where: { businessId_userId: { businessId, userId: user.id } },
      create: {
        businessId,
        userId: user.id,
        role: BusinessMemberRole.OWNER,
        status: MembershipStatus.ACTIVE,
      },
      update: { role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { role: UserRole.BUSINESS_OWNER },
    });
  });

  await logAdminAction(
    admin.id,
    "business.assign_owner",
    "Business",
    businessId,
    `owner: ${normalizedEmail}`
  );

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true, message: "Sahip atandı." };
}

// ─── Admin Business Create / Edit ──────────────────────────────

function normalizeSocialUrlAdmin(value: string | undefined | null, base: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http")) return trimmed;
  return `${base}${trimmed.replace(/^@/, "")}`;
}

const adminCreateBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  instagramUrl: z.string().max(200).optional().or(z.literal("")),
  facebookUrl: z.string().max(200).optional().or(z.literal("")),
  tiktokUrl: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  categoryIds: z.array(z.string()).max(10).default([]),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  instantConfirmation: z.boolean().default(false),
  inAppPayment: z.boolean().default(false),
  petFriendly: z.boolean().default(false),
  maxGroupBookingGuests: z.number().int().min(1).max(20).default(4),
});

export async function adminCreateBusiness(
  input: z.infer<typeof adminCreateBusinessSchema>
): Promise<AdminActionState & { businessId?: string }> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = adminCreateBusinessSchema.safeParse(input);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const data = result.data;
  const ownerEmail = data.ownerEmail?.trim() || null;

  let ownerId: string | null = null;

  if (ownerEmail) {
    const owner = await db.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true },
    });
    if (!owner) {
      return { success: false, message: `'${ownerEmail}' e-postasına sahip kullanıcı bulunamadı.` };
    }

    const [existingMember, legacyBusiness] = await Promise.all([
      db.businessMember.findFirst({
        where: { userId: owner.id, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
        select: { businessId: true },
      }),
      db.business.findFirst({
        where: { ownerId: owner.id },
        select: { id: true },
      }),
    ]);

    if (existingMember || legacyBusiness) {
      return { success: false, message: "Bu kullanıcı zaten başka bir işletmenin sahibidir." };
    }

    ownerId = owner.id;
  }

  const { generateUniqueSlug } = await import("@/lib/slug");
  const slug = await generateUniqueSlug(data.name);

  const businessData = {
    name: data.name,
    slug,
    description: data.description?.trim() || null,
    phone: data.phone?.trim() || null,
    whatsapp: data.whatsapp?.trim() || null,
    instagramUrl: normalizeSocialUrlAdmin(data.instagramUrl, "https://instagram.com/"),
    facebookUrl: normalizeSocialUrlAdmin(data.facebookUrl, "https://facebook.com/"),
    tiktokUrl: normalizeSocialUrlAdmin(data.tiktokUrl, "https://tiktok.com/@"),
    city: data.city?.trim() || null,
    district: data.district?.trim() || null,
    address: data.address?.trim() || null,
    status: "ACTIVE_PRIVATE" as const,
    isMarketplaceVisible: false,
    instantConfirmation: ownerId ? data.instantConfirmation : false,
    inAppPayment: ownerId ? data.inAppPayment : false,
    petFriendly: ownerId ? data.petFriendly : false,
    maxGroupBookingGuests: data.maxGroupBookingGuests,
    ...(ownerId
      ? { ownerId, ownershipStatus: "CLAIMED" as const }
      : { ownerId: null, ownershipStatus: "UNCLAIMED" as const }),
  };

  const business = await db.$transaction(async (tx) => {
    const created = await tx.business.create({
      data: businessData,
      select: { id: true },
    });

    if (data.categoryIds.length > 0) {
      await tx.businessToCategory.createMany({
        data: data.categoryIds.map((categoryId) => ({ businessId: created.id, categoryId })),
        skipDuplicates: true,
      });
    }

    if (ownerId) {
      await tx.businessMember.create({
        data: { businessId: created.id, userId: ownerId, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
      });
      await tx.user.update({
        where: { id: ownerId },
        data: { role: UserRole.BUSINESS_OWNER },
      });
    }

    return created;
  });

  await logAdminAction(
    admin.id,
    "business.create",
    "Business",
    business.id,
    ownerId ? `Sahipli — owner: ${ownerEmail}` : "Sahipsiz (UNCLAIMED)"
  );

  revalidatePath("/admin/businesses");
  return { success: true, businessId: business.id };
}

const adminUpdateBusinessSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  instagramUrl: z.string().max(200).optional().or(z.literal("")),
  facebookUrl: z.string().max(200).optional().or(z.literal("")),
  tiktokUrl: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  categoryIds: z.array(z.string()).max(10).default([]),
  instantConfirmation: z.boolean(),
  inAppPayment: z.boolean(),
  petFriendly: z.boolean(),
  maxGroupBookingGuests: z.number().int().min(1).max(20),
});

export async function adminUpdateBusiness(
  input: z.infer<typeof adminUpdateBusinessSchema>
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = adminUpdateBusinessSchema.safeParse(input);
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const data = result.data;

  const existing = await db.business.findUnique({
    where: { id: data.businessId },
    select: { id: true },
  });

  if (!existing) {
    return { success: false, message: "İşletme bulunamadı." };
  }

  await db.$transaction(async (tx) => {
    await tx.businessToCategory.deleteMany({ where: { businessId: data.businessId } });

    if (data.categoryIds.length > 0) {
      await tx.businessToCategory.createMany({
        data: data.categoryIds.map((categoryId) => ({ businessId: data.businessId, categoryId })),
        skipDuplicates: true,
      });
    }

    await tx.business.update({
      where: { id: data.businessId },
      data: {
        name: data.name,
        description: data.description?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        instagramUrl: normalizeSocialUrlAdmin(data.instagramUrl, "https://instagram.com/"),
        facebookUrl: normalizeSocialUrlAdmin(data.facebookUrl, "https://facebook.com/"),
        tiktokUrl: normalizeSocialUrlAdmin(data.tiktokUrl, "https://tiktok.com/@"),
        city: data.city?.trim() || null,
        district: data.district?.trim() || null,
        address: data.address?.trim() || null,
        instantConfirmation: data.instantConfirmation,
        inAppPayment: data.inAppPayment,
        petFriendly: data.petFriendly,
        maxGroupBookingGuests: data.maxGroupBookingGuests,
      },
    });
  });

  await logAdminAction(admin.id, "business.update", "Business", data.businessId, "Admin düzenlemesi");

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${data.businessId}`);
  return { success: true, message: "İşletme güncellendi." };
}

// ─── User Actions ──────────────────────────────────────────────

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: z.enum(["CUSTOMER", "BUSINESS_OWNER", "ADMIN"]),
});

export async function changeUserRole(
  userId: string,
  newRole: UserRole
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = changeRoleSchema.safeParse({ userId, newRole });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  if (userId === admin.id) {
    return { success: false, message: "Cannot change your own role." };
  }

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!targetUser) {
    return { success: false, message: "User not found." };
  }

  if (targetUser.role === newRole) {
    return { success: false, message: "User already has this role." };
  }

  // Guard: cannot demote BUSINESS_OWNER → CUSTOMER (would orphan business)
  if (targetUser.role === "BUSINESS_OWNER" && newRole === "CUSTOMER") {
    return {
      success: false,
      message:
        "Cannot change role while user owns an active business. Not supported in this version.",
    };
  }

  // Guard: cannot remove last admin
  if (targetUser.role === "ADMIN" && newRole !== "ADMIN") {
    const adminCount = await db.user.count({
      where: { role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return {
        success: false,
        message: "Cannot remove the last admin.",
      };
    }
  }

  // Guard: BUSINESS_OWNER requires existing Business record (via member role or legacy ownerId)
  if (newRole === "BUSINESS_OWNER") {
    const [memberBusiness, legacyBusiness] = await Promise.all([
      db.businessMember.findFirst({
        where: { userId, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
        select: { businessId: true },
      }),
      db.business.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      }),
    ]);
    if (!memberBusiness && !legacyBusiness) {
      return {
        success: false,
        message:
          "User must complete business registration first. Cannot assign Business Owner role without a business.",
      };
    }
  }

  const oldRole = targetUser.role;

  await db.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await logAdminAction(
    admin.id,
    "user.change_role",
    "User",
    userId,
    `${oldRole} → ${newRole}`
  );

  revalidateAdmin();
  return { success: true, message: `Role updated to ${newRole}.` };
}

const suspendUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(1, "Reason is required").max(500),
  durationDays: z.number().int().min(1).optional(),
});

export async function adminSuspendUser(
  userId: string,
  reason: string,
  durationDays?: number
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = suspendUserSchema.safeParse({ userId, reason, durationDays });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  if (userId === admin.id) {
    return { success: false, message: "Cannot suspend yourself." };
  }

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, suspendedAt: true },
  });

  if (!targetUser) {
    return { success: false, message: "User not found." };
  }

  if (targetUser.suspendedAt) {
    return { success: false, message: "User is already suspended." };
  }

  const targetUserFull = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (targetUserFull?.role === "ADMIN") {
    const activeAdminCount = await db.user.count({
      where: {
        role: "ADMIN",
        OR: [{ suspendedAt: null }, { suspendedUntil: { lt: new Date() } }],
      },
    });

    if (activeAdminCount <= 1) {
      return { success: false, message: "Cannot suspend the last active admin user." };
    }
  }

  const now = new Date();
  const suspendedUntil = durationDays
    ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  await db.user.update({
    where: { id: userId },
    data: {
      suspendedAt: now,
      suspendedUntil,
      suspensionReason: reason,
    },
  });

  await logAdminAction(
    admin.id,
    "user.suspend",
    "User",
    userId,
    `Suspended${durationDays ? ` for ${durationDays} days` : " indefinitely"}, reason: ${reason}`
  );

  revalidateAdmin();
  return {
    success: true,
    message: `User suspended${durationDays ? ` for ${durationDays} days` : " indefinitely"}.`,
  };
}

export async function adminUnsuspendUser(userId: string): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, suspendedAt: true },
  });

  if (!targetUser) {
    return { success: false, message: "User not found." };
  }

  if (!targetUser.suspendedAt) {
    return { success: false, message: "User is not suspended." };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      suspendedAt: null,
      suspendedUntil: null,
      suspensionReason: null,
    },
  });

  await logAdminAction(
    admin.id,
    "user.unsuspend",
    "User",
    userId,
    "Suspension lifted"
  );

  revalidateAdmin();
  return { success: true, message: "User unsuspended." };
}

export async function resendVerificationEmail(
  userId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) {
    return { success: false, message: "User not found." };
  }

  if (user.emailVerified) {
    return { success: false, message: "User email is already verified." };
  }

  // Create a verification token
  const verificationToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  try {
    await db.verification.create({
      data: {
        identifier: user.email,
        value: verificationToken,
        expiresAt,
      },
    });

    // Send email non-blockingly via after()
    after(async () => {
      try {
        const { sendVerificationEmail } = await import("@/lib/email-notifications");
        await sendVerificationEmail(user.email, verificationToken);
      } catch (err) {
        console.error("[email] resendVerificationEmail:", err);
      }
    });

    await logAdminAction(
      admin.id,
      "user.resend_verification_email",
      "User",
      userId,
      user.email
    );

    revalidateAdmin();
    revalidatePath(`/admin/users/${userId}`);
    return {
      success: true,
      message: "Verification email sent.",
    };
  } catch (err) {
    console.error("Failed to resend verification email:", err);
    return { success: false, message: "Failed to send email." };
  }
}

export async function adminResetConsentVersion(
  userId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, preferences: true },
  });

  if (!user) {
    return { success: false, message: "User not found." };
  }

  if (!user.preferences) {
    // Create preferences record if doesn't exist
    await db.userPreferences.create({
      data: {
        userId,
        consentVersion: null,
      },
    });
  } else {
    // Reset version to null to trigger re-consent banner
    await db.userPreferences.update({
      where: { userId },
      data: { consentVersion: null },
    });
  }

  await logAdminAction(
    admin.id,
    "user.reset_consent_version",
    "User",
    userId,
    "Consent version reset to null"
  );

  revalidateAdmin();
  revalidatePath(`/admin/users/${userId}`);
  return {
    success: true,
    message: "Consent version reset. User will see re-consent banner on next visit.",
  };
}

// ─── Media Actions (Soft Moderation) ───────────────────────────

const hideMediaSchema = z.object({
  mediaId: z.string().min(1),
  reason: z.string().min(1, "Reason is required for hiding media").max(500),
});

const removeMediaSchema = z.object({
  mediaId: z.string().min(1),
  reason: z.string().min(1, "Reason is required for removing media").max(500),
});

async function clearCoverLogoIfNeeded(
  mediaId: string,
  businessId: string,
  mediaType: string
) {
  if (mediaType === "COVER") {
    await db.business.update({
      where: { id: businessId },
      data: { coverImageUrl: null },
    });
  } else if (mediaType === "LOGO") {
    await db.business.update({
      where: { id: businessId },
      data: { logoUrl: null },
    });
  }
}

export async function hideMedia(
  mediaId: string,
  reason: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = hideMediaSchema.safeParse({ mediaId, reason });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
    select: { status: true, type: true, businessId: true },
  });

  if (!media) {
    return { success: false, message: "Media not found." };
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { status: "HIDDEN" },
  });

  await clearCoverLogoIfNeeded(mediaId, media.businessId, media.type);

  const details = `${media.status} → HIDDEN, reason: ${reason}`;

  await logAdminAction(
    admin.id,
    "media.hide",
    "BusinessMedia",
    mediaId,
    details
  );

  const slug = await getBusinessSlug(media.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  after(async () => {
    await sendMediaModeratedEmail(mediaId, "hidden", reason);
  });

  return { success: true, message: "Media hidden." };
}

export async function removeMedia(
  mediaId: string,
  reason: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = removeMediaSchema.safeParse({ mediaId, reason });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
    select: { status: true, type: true, businessId: true },
  });

  if (!media) {
    return { success: false, message: "Media not found." };
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { status: "REMOVED" },
  });

  await clearCoverLogoIfNeeded(mediaId, media.businessId, media.type);

  const details = `${media.status} → REMOVED, reason: ${reason}`;

  await logAdminAction(
    admin.id,
    "media.remove",
    "BusinessMedia",
    mediaId,
    details
  );

  const slug = await getBusinessSlug(media.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  after(async () => {
    await sendMediaModeratedEmail(mediaId, "removed", reason);
  });

  return { success: true, message: "Media removed." };
}

export async function restoreMedia(
  mediaId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
    select: { status: true, businessId: true },
  });

  if (!media) {
    return { success: false, message: "Media not found." };
  }

  await db.businessMedia.update({
    where: { id: mediaId },
    data: { status: "ACTIVE" },
  });

  await logAdminAction(
    admin.id,
    "media.restore",
    "BusinessMedia",
    mediaId,
    `${media.status} → ACTIVE`
  );

  const slug = await getBusinessSlug(media.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Media restored." };
}

// ─── Review Actions ────────────────────────────────────────────

const adminHideReviewSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.string().min(1, "Reason is required for hiding a review").max(500),
});

const adminRemoveReviewSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.string().min(1, "Reason is required for removing a review").max(500),
});

export async function adminApproveReview(
  reviewId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true, businessId: true },
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "APPROVED" },
  });

  await logAdminAction(
    admin.id,
    "review.approve",
    "Review",
    reviewId,
    `${review.status} → APPROVED`
  );

  const slug = await getBusinessSlug(review.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Review approved." };
}

export async function adminHideReview(
  reviewId: string,
  reason: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = adminHideReviewSchema.safeParse({ reviewId, reason });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true, businessId: true },
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "HIDDEN" },
  });

  const details = `${review.status} → HIDDEN, reason: ${reason}`;

  await logAdminAction(
    admin.id,
    "review.hide",
    "Review",
    reviewId,
    details
  );

  const slug = await getBusinessSlug(review.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  after(async () => {
    await sendReviewModeratedEmail(reviewId, "hidden", reason);
  });

  return { success: true, message: "Review hidden." };
}

export async function adminRemoveReview(
  reviewId: string,
  reason: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = adminRemoveReviewSchema.safeParse({ reviewId, reason });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true, businessId: true },
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "REMOVED" },
  });

  const details = `${review.status} → REMOVED, reason: ${reason}`;

  await logAdminAction(
    admin.id,
    "review.remove",
    "Review",
    reviewId,
    details
  );

  const slug = await getBusinessSlug(review.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  after(async () => {
    await sendReviewModeratedEmail(reviewId, "removed", reason);
  });

  return { success: true, message: "Review removed." };
}

export async function adminRestoreReview(
  reviewId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true, businessId: true },
  });

  if (!review) {
    return { success: false, message: "Review not found." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: { status: "APPROVED" },
  });

  await logAdminAction(
    admin.id,
    "review.restore",
    "Review",
    reviewId,
    `${review.status} → APPROVED`
  );

  const slug = await getBusinessSlug(review.businessId);
  revalidateAdmin();
  if (slug) revalidatePath(`/b/${slug}`);

  return { success: true, message: "Review restored." };
}

// ─── Category Actions ──────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes"),
  description: z.string().max(500).optional().or(z.literal("")),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export async function createCategory(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const result = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  try {
    const category = await db.businessCategory.create({
      data: {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description || null,
        imageUrl: result.data.imageUrl || null,
        sortOrder: result.data.sortOrder,
      },
    });

    await logAdminAction(
      admin.id,
      "category.create",
      "BusinessCategory",
      category.id,
      `name: ${category.name}`
    );

    revalidateAdmin();
    return { success: true, message: "Category created." };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        message: "A category with this slug already exists.",
      };
    }
    throw err;
  }
}

export async function updateCategory(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) {
    return { success: false, message: "Category ID is required." };
  }

  const result = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const existing = await db.businessCategory.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });

  if (!existing) {
    return { success: false, message: "Category not found." };
  }

  try {
    await db.businessCategory.update({
      where: { id: categoryId },
      data: {
        name: result.data.name,
        slug: result.data.slug,
        description: result.data.description || null,
        imageUrl: result.data.imageUrl || null,
        sortOrder: result.data.sortOrder,
      },
    });

    await logAdminAction(
      admin.id,
      "category.update",
      "BusinessCategory",
      categoryId,
      `name: ${existing.name} → ${result.data.name}`
    );

    revalidateAdmin();
    return { success: true, message: "Category updated." };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        message: "A category with this slug already exists.",
      };
    }
    throw err;
  }
}

export async function deleteCategory(
  categoryId: string
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const category = await db.businessCategory.findUnique({
    where: { id: categoryId },
    select: { name: true, _count: { select: { businesses: true } } },
  });

  if (!category) {
    return { success: false, message: "Category not found." };
  }

  if (category._count.businesses > 0) {
    return {
      success: false,
      message: `Cannot delete: ${category._count.businesses} business${category._count.businesses !== 1 ? "es" : ""} use this category.`,
    };
  }

  await db.businessCategory.delete({ where: { id: categoryId } });

  await logAdminAction(
    admin.id,
    "category.delete",
    "BusinessCategory",
    categoryId,
    `name: ${category.name}`
  );

  revalidateAdmin();
  return { success: true, message: "Category deleted." };
}

// ─── Campaigns ────────────────────────────────────────────────

export interface MarketingAudienceFilters {
  roles?: string[];
  businessStatuses?: string[];
  cities?: string[];
  categoryIds?: string[];
  locales?: string[];
  activeWithinDays?: number;
}

const campaignFormSchema = z.object({
  name: z.string().min(1).max(255),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
  subject: z.string().max(255).optional(),
  contentJson: z.unknown().optional(),
  templateName: z.string().optional(),
  templateParams: z.record(z.string(), z.unknown()).optional(),
  audienceFilters: z.record(z.string(), z.unknown()).optional(),
});

function toInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value == null ? undefined : (value as Prisma.InputJsonValue);
}

function toRequiredInputJson(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}

function getTemplateParams(value: unknown): Record<string, string | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, string | undefined>;
}

function getCampaignEmailBody(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "<p>No content</p>";
  }
  const body = (value as { body?: unknown }).body;
  return typeof body === "string" && body.trim() ? body : "<p>No content</p>";
}

function toUserRoleFilters(roles?: string[]): UserRole[] {
  if (!roles?.length) return [];
  const validRoles = new Set<UserRole>(Object.values(UserRole));
  return roles.filter((role): role is UserRole =>
    validRoles.has(role as UserRole)
  );
}

export async function createCampaign(
  formData: unknown
): Promise<AdminActionState & { campaignId?: string }> {
  const admin = await requireRole(UserRole.ADMIN);

  const validationResult = campaignFormSchema.safeParse(formData);
  if (!validationResult.success) {
    return { success: false, message: "Invalid form data." };
  }

  const data = validationResult.data;

  try {
    const campaign = await db.campaign.create({
      data: {
        name: data.name,
        channel: data.channel,
        status: "DRAFT",
        subject: data.subject || null,
        contentJson: toInputJson(data.contentJson),
        templateName: data.templateName || null,
        templateParams: toInputJson(data.templateParams),
        audienceFilters: toRequiredInputJson(data.audienceFilters),
        createdById: admin.id,
      },
    });

    await logAdminAction(
      admin.id,
      "campaign.create",
      "Campaign",
      campaign.id,
      `${data.channel} campaign: ${data.name}`
    );

    revalidatePath("/admin/campaigns");

    return {
      success: true,
      message: "Campaign created.",
      campaignId: campaign.id,
    };
  } catch (err) {
    console.error("Failed to create campaign:", err);
    return { success: false, message: "Failed to create campaign." };
  }
}

export async function updateCampaign(
  campaignId: string,
  formData: unknown
): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const validationResult = campaignFormSchema.safeParse(formData);
  if (!validationResult.success) {
    return { success: false, message: "Invalid form data." };
  }

  const data = validationResult.data;

  try {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true },
    });

    if (!campaign) {
      return { success: false, message: "Campaign not found." };
    }

    if (campaign.status !== "DRAFT") {
      return {
        success: false,
        message: "Can only edit campaigns in DRAFT status.",
      };
    }

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        subject: data.subject || null,
        contentJson: toInputJson(data.contentJson),
        templateName: data.templateName || null,
        templateParams: toInputJson(data.templateParams),
        audienceFilters: toRequiredInputJson(data.audienceFilters),
      },
    });

    await logAdminAction(
      admin.id,
      "campaign.update",
      "Campaign",
      campaignId,
      `Updated: ${data.name}`
    );

    revalidatePath(`/admin/campaigns/${campaignId}`);
    revalidatePath("/admin/campaigns");

    return { success: true, message: "Campaign updated." };
  } catch (err) {
    console.error("Failed to update campaign:", err);
    return { success: false, message: "Failed to update campaign." };
  }
}

export async function snapshotCampaignAudience(
  campaignId: string,
  audienceFilters: MarketingAudienceFilters
): Promise<AdminActionState & { recipientCount?: number }> {
  const admin = await requireRole(UserRole.ADMIN);

  try {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true, channel: true },
    });

    if (!campaign) {
      return { success: false, message: "Campaign not found." };
    }

    if (campaign.status !== "DRAFT") {
      return {
        success: false,
        message: "Can only snapshot audience for DRAFT campaigns.",
      };
    }

    // Build audience query based on channel
    const andFilters: Prisma.UserWhereInput[] = [
      {
        preferences: {
          marketingConsentAt: { not: null },
          marketingRevokedAt: null,
        },
      },
    ];
    const where: Prisma.UserWhereInput = { AND: andFilters };

    if (campaign.channel === "EMAIL") {
      andFilters.push({
        emailVerified: true,
      });
      andFilters.push({
        preferences: {
          emailMarketing: true,
        },
      });
    } else if (campaign.channel === "WHATSAPP") {
      andFilters.push({
        OR: [
          { phone: { not: null } },
          { business: { whatsapp: { not: null } } },
        ],
      });
      andFilters.push({
        preferences: {
          whatsappMarketing: true,
        },
      });
    }

    // Apply filters
    const roleFilters = toUserRoleFilters(audienceFilters.roles);
    if (roleFilters.length > 0) {
      where.role = { in: roleFilters };
    }
    if (audienceFilters.locales && audienceFilters.locales.length > 0) {
      andFilters.push({
        preferences: {
          locale: { in: audienceFilters.locales },
        },
      });
    }

    // Get eligible users
    const eligibleUsers = await db.user.findMany({
      where,
      select: { id: true, email: true, phone: true },
    });

    // Delete existing recipients for this campaign (in case re-snapshotting)
    await db.campaignRecipient.deleteMany({
      where: { campaignId },
    });

    // Create campaign recipient records
    const recipients = eligibleUsers.map((user) => ({
      campaignId,
      userId: user.id,
      recipientEmail: campaign.channel === "EMAIL" ? user.email : null,
      recipientPhone: campaign.channel === "WHATSAPP" ? user.phone : null,
      status: "PENDING" as const,
    }));

    await db.campaignRecipient.createMany({
      data: recipients,
    });

    // Update campaign with snapshot count and status
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        recipientCount: recipients.length,
        status: "READY",
        audienceFilters: toRequiredInputJson(audienceFilters),
      },
    });

    await logAdminAction(
      admin.id,
      "campaign.snapshot_audience",
      "Campaign",
      campaignId,
      `Snapshotted ${recipients.length} recipients`
    );

    revalidatePath(`/admin/campaigns/${campaignId}`);

    return {
      success: true,
      message: `Campaign ready with ${recipients.length} recipients.`,
      recipientCount: recipients.length,
    };
  } catch (err) {
    console.error("Failed to snapshot campaign audience:", err);
    return {
      success: false,
      message: "Failed to snapshot audience.",
    };
  }
}

export async function getEmailMarketingAudienceCount(
  filters: MarketingAudienceFilters
): Promise<{ count: number; success: boolean }> {
  await requireRole(UserRole.ADMIN);

  try {
    const where: Prisma.UserWhereInput = {
      AND: [
        {
          preferences: {
            marketingConsentAt: { not: null },
            marketingRevokedAt: null,
            emailMarketing: true,
          },
        },
        {
          emailVerified: true,
        },
      ],
    };

    const roleFilters = toUserRoleFilters(filters.roles);
    if (roleFilters.length > 0) {
      where.role = { in: roleFilters };
    }

    const count = await db.user.count({ where });
    return { count, success: true };
  } catch {
    return { count: 0, success: false };
  }
}

export async function sendMarketingWhatsAppCampaign(
  campaignId: string
): Promise<AdminActionState & { sentCount?: number; failedCount?: number }> {
  const admin = await requireRole(UserRole.ADMIN);

  try {
    const {
      getApprovedWhatsAppMarketingTemplates,
      isApprovedMarketingTemplate,
    } = await import("@/lib/whatsapp-marketing-config");

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: {
          where: { status: "PENDING" },
          select: {
            id: true,
            userId: true,
            recipientPhone: true,
            user: {
              select: {
                phone: true,
                preferences: {
                  select: {
                    marketingConsentAt: true,
                    marketingRevokedAt: true,
                    whatsappMarketing: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return { success: false, message: "Campaign not found." };
    }

    if (campaign.status !== "READY") {
      return {
        success: false,
        message: "Campaign must be in READY status to send.",
      };
    }

    if (campaign.channel !== "WHATSAPP") {
      return {
        success: false,
        message: "This function is for WhatsApp campaigns only.",
      };
    }

    // Check template approval status
    const approvedTemplates = getApprovedWhatsAppMarketingTemplates();
    if (approvedTemplates.length === 0) {
      return {
        success: false,
        message:
          "No WhatsApp marketing templates approved. Phase 4 requires Meta template pre-approval. Contact admin to configure WHATSAPP_MARKETING_TEMPLATES.",
      };
    }

    const templateName = campaign.templateName;
    if (!templateName || !isApprovedMarketingTemplate(templateName)) {
      return {
        success: false,
        message: `Template "${templateName}" is not approved for marketing. Approved templates: ${approvedTemplates.map((t) => t.name).join(", ")}`,
      };
    }

    // Validate template language matches approved configuration
    const approvedTemplate = approvedTemplates.find((t) => t.name === templateName);
    const templateParams = getTemplateParams(campaign.templateParams);
    const campaignLanguage = templateParams.language || "en";
    if (approvedTemplate && approvedTemplate.language !== campaignLanguage) {
      return {
        success: false,
        message: `Template "${templateName}" language mismatch. Configured: ${approvedTemplate.language}, Campaign: ${campaignLanguage}. Update campaign language or use a different template.`,
      };
    }

    // Check dry-run mode
    const isDryRun = process.env.WHATSAPP_DRY_RUN !== "false";
    const recipients = campaign.recipients;

    if (recipients.length === 0) {
      return { success: false, message: "No pending recipients." };
    }

    // Check audience size cap for Phase 1
    if (recipients.length > 2000) {
      return {
        success: false,
        message: "Phase 1 limited to 2,000 recipients. Please use Phase 2 queue infrastructure.",
      };
    }

    // Update campaign status to SENDING
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    });

    let sentCount = 0;
    let failedCount = 0;
    const errors: Record<string, number> = {};

    // Send in batches (respecting WhatsApp rate limits)
    const batchSize = 50;
    const batchDelayMs = 500;

    const { sendWhatsAppMarketingTemplate } = await import(
      "@/lib/external/whatsapp/client"
    );
    const { normalizeTurkishPhone } = await import(
      "@/lib/external/whatsapp/phone"
    );

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      // Process batch concurrently
      const results = await Promise.all(
        batch.map(async (recipient) => {
          // Re-validate consent at send time
          if (
            !recipient.user.preferences?.marketingConsentAt ||
            recipient.user.preferences?.marketingRevokedAt ||
            !recipient.user.preferences?.whatsappMarketing
          ) {
            return { success: false, error: "Consent revoked or not opted in" };
          }

          // Validate phone number
          const phone = recipient.recipientPhone || recipient.user.phone;
          if (!phone) {
            return { success: false, error: "No phone number" };
          }

          const normalizedPhone = normalizeTurkishPhone(phone);
          if (!normalizedPhone) {
            return { success: false, error: "Invalid phone number format" };
          }

          try {
            if (isDryRun) {
              return { success: true, messageId: `dry-run-${Date.now()}` };
            }

            // Send WhatsApp marketing template message
            const messageId = await sendWhatsAppMarketingTemplate({
              to: normalizedPhone,
              templateName,
              templateLanguage: campaignLanguage,
              parameters: templateParams,
            });

            return { success: true, messageId };
          } catch (err) {
            console.error(
              `Failed to send to ${normalizedPhone}:`,
              err
            );
            return { success: false, error: String(err) };
          }
        })
      );

      // Update recipient statuses and track errors
      for (let j = 0; j < batch.length; j++) {
        const result = results[j];
        const recipient = batch[j];

        if (result.success) {
          await db.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "SENT",
              providerMessageId: result.messageId,
              sentAt: new Date(),
            },
          });
          sentCount++;
        } else {
          const errorMsg = result.error || "Unknown error";
          await db.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              errorMessage: errorMsg,
            },
          });
          failedCount++;
          errors[errorMsg] = (errors[errorMsg] || 0) + 1;
        }
      }

      // Rate limiting between batches
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
      }
    }

    // Update campaign status based on results
    const finalStatus =
      failedCount === 0 ? "SENT" : failedCount > 0 ? "PARTIAL_FAILURE" : "SENT";

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        completedAt: new Date(),
      },
    });

    await logAdminAction(
      admin.id,
      "campaign.send_whatsapp",
      "Campaign",
      campaignId,
      `Sent to ${sentCount} recipients, ${failedCount} failed. ${isDryRun ? "[DRY_RUN]" : ""}`
    );

    const summary = isDryRun
      ? `[DRY-RUN MODE] Would send to ${sentCount + failedCount} recipients. Template: ${templateName}`
      : `Sent to ${sentCount} recipients. ${failedCount > 0 ? `${failedCount} failed.` : ""}`;

    return {
      success: failedCount === 0,
      message: summary,
      sentCount,
      failedCount,
    };
  } catch (err) {
    console.error("Failed to send WhatsApp campaign:", err);
    return { success: false, message: "Failed to process WhatsApp campaign." };
  }
}

export async function sendMarketingEmailCampaign(
  campaignId: string
): Promise<AdminActionState & { sentCount?: number; failedCount?: number }> {
  const admin = await requireRole(UserRole.ADMIN);

  try {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: {
          where: { status: "PENDING" },
          select: {
            id: true,
            userId: true,
            recipientEmail: true,
            user: {
              select: {
                firstName: true,
                preferences: {
                  select: {
                    marketingConsentAt: true,
                    marketingRevokedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return { success: false, message: "Campaign not found." };
    }

    if (campaign.status !== "READY") {
      return {
        success: false,
        message: "Campaign must be in READY status to send.",
      };
    }

    if (campaign.channel !== "EMAIL") {
      return {
        success: false,
        message: "This function is for email campaigns only.",
      };
    }

    // Check for dry-run mode (defaults to true/safe when unset)
    const isDryRun = env.CAMPAIGN_DRY_RUN !== "false";

    const recipients = campaign.recipients;

    if (recipients.length === 0) {
      return { success: false, message: "No pending recipients." };
    }

    // Check audience size cap for Phase 1
    if (recipients.length > 2000) {
      return {
        success: false,
        message: "Phase 1 limited to 2,000 recipients. Please use Phase 2 queue infrastructure.",
      };
    }

    // Update campaign status to SENDING
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    });

    let sentCount = 0;
    let failedCount = 0;
    const errors: Record<string, number> = {};

    // Send in batches (respecting Resend rate limits)
    const batchSize = 50;
    const { sendEmail } = await import("@/lib/email");
    const { MarketingEmail } = await import("@/emails/marketing-base");
    const React = await import("react");
    const { ensureUnsubscribeToken } = await import("@/lib/unsubscribe");

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      // Process batch concurrently
      const results = await Promise.all(
        batch.map(async (recipient) => {
          // Double-check consent at send time
          if (
            !recipient.user.preferences?.marketingConsentAt ||
            recipient.user.preferences?.marketingRevokedAt
          ) {
            return { success: false, error: "Consent revoked" };
          }

          try {
            // Generate unsubscribe token
            const unsubscribeToken = await ensureUnsubscribeToken(
              recipient.userId
            );
            const unsubscribeUrl = new URL(
              `/api/unsubscribe/${unsubscribeToken}`,
              env.NEXT_PUBLIC_APP_URL
            ).toString();

            if (isDryRun) {
              return { success: true, messageId: `dry-run-${Date.now()}` };
            }

            const content = React.createElement("div", {
              dangerouslySetInnerHTML: {
                __html: getCampaignEmailBody(campaign.contentJson),
              },
            });

            // Send email
            const result = await sendEmail({
              to: recipient.recipientEmail!,
              subject: campaign.subject!,
              react: React.createElement(
                MarketingEmail,
                {
                  preview: campaign.subject || "UrGlowUp Marketing",
                  subject: campaign.subject!,
                  unsubscribeUrl,
                },
                content
              ),
              tags: [
                { name: "flow", value: "marketing" },
                { name: "campaign", value: campaignId },
              ],
              template: "marketing",
            });

            return result;
          } catch (err) {
            console.error(`Failed to send to ${recipient.recipientEmail}:`, err);
            return { success: false, error: String(err) };
          }
        })
      );

      // Update recipient statuses
      for (let j = 0; j < batch.length; j++) {
        const result = results[j];
        const recipient = batch[j];

        if (result.success) {
          await db.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "SENT",
              providerMessageId: result.messageId,
              sentAt: new Date(),
            },
          });
          sentCount++;
        } else {
          const errorMsg = result.error || "Unknown error";
          errors[errorMsg] = (errors[errorMsg] || 0) + 1;
          await db.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              errorMessage: errorMsg,
            },
          });
          failedCount++;
        }
      }

      // Rate limit: 200ms between batches
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Update campaign with final status
    const finalStatus = failedCount > 0 ? "PARTIAL_FAILURE" : "SENT";
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        completedAt: new Date(),
      },
    });

    await logAdminAction(
      admin.id,
      "campaign.send",
      "Campaign",
      campaignId,
      `Sent to ${sentCount} recipients, ${failedCount} failed`
    );

    revalidatePath(`/admin/campaigns/${campaignId}`);
    revalidatePath("/admin/campaigns");

    return {
      success: true,
      message: `Campaign sent to ${sentCount} recipients${failedCount > 0 ? ` (${failedCount} failed)` : ""}.`,
      sentCount,
      failedCount,
    };
  } catch (err) {
    console.error("Failed to send campaign:", err);
    return { success: false, message: "Failed to send campaign." };
  }
}

// ─── MFA Management ────────────────────────────────────────────

export async function adminResetUserMfa(userId: string): Promise<AdminActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  if (userId === admin.id) {
    return {
      success: false,
      message: "Cannot reset your own MFA. Use backup codes on the challenge page.",
    };
  }

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, twoFactorEnabled: true, email: true },
  });

  if (!targetUser) {
    return { success: false, message: "User not found." };
  }

  if (targetUser.role !== UserRole.ADMIN) {
    return { success: false, message: "MFA reset only applies to admin users." };
  }

  if (!targetUser.twoFactorEnabled) {
    return { success: false, message: "User does not have MFA enabled." };
  }

  // Check if this is the last admin with MFA enrolled
  const mfaAdminCount = await db.user.count({
    where: { role: UserRole.ADMIN, twoFactorEnabled: true },
  });

  if (mfaAdminCount <= 1) {
    return {
      success: false,
      message:
        "Cannot reset the only admin with MFA enabled. Enroll another admin first, or use recovery codes on the challenge page.",
    };
  }

  // Reset MFA
  try {
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false },
      }),
      db.twoFactor.deleteMany({
        where: { userId },
      }),
    ]);

    await logAdminAction(
      admin.id,
      "user.reset_mfa",
      "User",
      userId,
      `MFA reset by admin ${admin.email}`
    );

    revalidatePath(`/admin/users/${userId}`);

    return {
      success: true,
      message: "MFA reset. User must re-enroll on next admin login.",
    };
  } catch (err) {
    console.error("Failed to reset user MFA:", err);
    return { success: false, message: "Failed to reset MFA." };
  }
}
