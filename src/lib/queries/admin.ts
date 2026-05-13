import { db } from "@/lib/db";
import type { AppointmentStatus, BusinessStatus, MediaStatus, ReviewStatus, UserRole } from "@/generated/prisma/enums";

// ─── Dashboard ─────────────────────────────────────────────────

export async function getAdminDashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    businessesByStatus,
    usersByRole,
    appointmentsThisWeek,
    hiddenMediaCount,
    pendingReviewCount,
  ] = await Promise.all([
    db.business.groupBy({ by: ["status"], _count: { id: true } }),
    db.user.groupBy({ by: ["role"], _count: { id: true } }),
    db.appointment.count({ where: { createdAt: { gte: weekAgo } } }),
    db.businessMedia.count({
      where: { status: { in: ["HIDDEN", "REMOVED"] } },
    }),
    db.review.count({ where: { status: "PENDING" } }),
  ]);

  const businessCounts: Record<string, number> = {};
  for (const row of businessesByStatus) {
    businessCounts[row.status] = row._count.id;
  }

  const userCounts: Record<string, number> = {};
  for (const row of usersByRole) {
    userCounts[row.role] = row._count.id;
  }

  return {
    businessCounts,
    userCounts,
    totalBusinesses: Object.values(businessCounts).reduce((a, b) => a + b, 0),
    totalUsers: Object.values(userCounts).reduce((a, b) => a + b, 0),
    pendingApprovals: businessCounts["PENDING_APPROVAL"] ?? 0,
    appointmentsThisWeek,
    hiddenMediaCount,
    pendingReviewCount,
  };
}

export async function getRecentAdminActions(limit = 20) {
  return db.adminAction.findMany({
    include: {
      admin: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export type AdminAction = Awaited<
  ReturnType<typeof getRecentAdminActions>
>[number];

// ─── Businesses ────────────────────────────────────────────────

export async function getAdminBusinesses(statusFilter?: BusinessStatus) {
  return db.business.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      owner: { select: { email: true, firstName: true, lastName: true } },
      categories: { include: { category: { select: { name: true } } } },
      _count: {
        select: { appointments: true, reviews: true, media: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type AdminBusiness = Awaited<
  ReturnType<typeof getAdminBusinesses>
>[number];

export async function getAdminBusinessDetail(businessId: string) {
  return db.business.findUnique({
    where: { id: businessId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      categories: { include: { category: true } },
      services: { orderBy: { sortOrder: "asc" } },
      media: { orderBy: { createdAt: "desc" }, take: 12 },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: {
            select: { firstName: true, lastName: true },
          },
        },
      },
      _count: {
        select: { appointments: true, reviews: true, media: true },
      },
    },
  });
}

export type AdminBusinessDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminBusinessDetail>>
>;

export async function getBusinessActionHistory(businessId: string) {
  return db.adminAction.findMany({
    where: { targetType: "Business", targetId: businessId },
    include: {
      admin: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// ─── Users ─────────────────────────────────────────────────────

export async function getAdminUsers(roleFilter?: UserRole) {
  return db.user.findMany({
    where: roleFilter ? { role: roleFilter } : {},
    include: {
      business: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type AdminUser = Awaited<ReturnType<typeof getAdminUsers>>[number];

// ─── Appointments ──────────────────────────────────────────────

export async function getAdminAppointments(
  statusFilter?: AppointmentStatus
) {
  return db.appointment.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      customer: {
        select: { firstName: true, lastName: true, email: true },
      },
      business: { select: { name: true, slug: true } },
      service: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type AdminAppointment = Awaited<
  ReturnType<typeof getAdminAppointments>
>[number];

// ─── Media ─────────────────────────────────────────────────────

export async function getAdminMedia(statusFilter?: MediaStatus) {
  return db.businessMedia.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      business: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type AdminMedia = Awaited<ReturnType<typeof getAdminMedia>>[number];

// ─── Reviews ───────────────────────────────────────────────────

export async function getAdminReviews(statusFilter?: ReviewStatus) {
  return db.review.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      customer: {
        select: { firstName: true, lastName: true, avatarUrl: true },
      },
      business: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type AdminReview = Awaited<
  ReturnType<typeof getAdminReviews>
>[number];

// ─── Categories ────────────────────────────────────────────────

export async function getAdminCategories() {
  return db.businessCategory.findMany({
    include: {
      _count: { select: { businesses: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export type AdminCategory = Awaited<
  ReturnType<typeof getAdminCategories>
>[number];
