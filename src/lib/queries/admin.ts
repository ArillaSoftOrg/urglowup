import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import type { AppointmentStatus, BusinessStatus, CampaignStatus, ClaimRequestStatus, MediaStatus, PlaceReferenceStatus, PostContentType, PostStatus, ReviewStatus, UserRole } from "@/generated/prisma/enums";

// ─── Dashboard ─────────────────────────────────────────────────

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

export const ADMIN_DASHBOARD_CACHE_TAG = "admin-dashboard";

export const getAdminDashboardMetrics = unstable_cache(
  async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const [
      businessesByStatus,
      usersByRole,
      appointmentsThisWeek,
      appointmentsLastWeek,
      hiddenMediaCount,
      pendingReviewCount,
      reviewsByStatus,
      newUsersLast7d,
      newBusinessesLast7d,
      platformRatingStats,
      postsByStatus,
      postsByContentType,
      mediaByStatus,
      pendingBusinesses,
      pendingReviews,
      appointmentTrend,
      unverifiedUserCount,
      inactiveUserCount,
      churnedUserCount,
      suspendedUserCount,
    ] = await Promise.all([
      db.business.groupBy({ by: ["status"], _count: { id: true } }),
      db.user.groupBy({ by: ["role"], _count: { id: true } }),
      db.appointment.count({ where: { createdAt: { gte: weekAgo } } }),
      db.appointment.count({
        where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
      }),
      db.businessMedia.count({
        where: { status: { in: ["HIDDEN", "REMOVED"] } },
      }),
      db.review.count({ where: { status: "PENDING" } }),
      db.review.groupBy({ by: ["status"], _count: { id: true } }),
      db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      db.business.count({ where: { createdAt: { gte: weekAgo } } }),
      db.businessRatingStats.aggregate({ _avg: { rawAverage: true } }),
      db.post.groupBy({ by: ["status"], _count: { id: true } }),
      db.post.groupBy({ by: ["contentType"], _count: { id: true } }),
      db.businessMedia.groupBy({ by: ["status"], _count: { id: true } }),
      db.business.findMany({
        where: { status: "PENDING_APPROVAL" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true,
          owner: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      db.review.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          business: { select: { id: true, name: true, slug: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
      (async () => {
        try {
          const rows = await db.$queryRaw<
            Array<{ day: Date; status: AppointmentStatus; count: number }>
          >`
            SELECT
              DATE("createdAt" AT TIME ZONE 'UTC') AS day,
              status,
              COUNT(*)::int AS count
            FROM "Appointment"
            WHERE "createdAt" >= ${sevenDaysAgo}
            GROUP BY day, status
            ORDER BY day ASC
          `;
          return rows || [];
        } catch (err) {
          console.error("Failed to fetch appointment trend:", err);
          return [];
        }
      })(),
      db.user.count({ where: { emailVerified: false } }),
      (async () => {
        try {
          const result = await db.$queryRaw<
            Array<{ count: bigint }>
          >`
            SELECT COUNT(*)
            FROM "User" u
            WHERE NOT EXISTS (
              SELECT 1 FROM "Session" s WHERE s."userId" = u.id AND s."updatedAt" > ${ninetyDaysAgo}
            )
            AND u."createdAt" <= ${ninetyDaysAgo}
          `;
          return Number(result?.[0]?.count ?? 0);
        } catch (err) {
          console.error("Failed to fetch inactive users:", err);
          return 0;
        }
      })(),
      (async () => {
        try {
          const result = await db.$queryRaw<
            Array<{ count: bigint }>
          >`
            SELECT COUNT(*)
            FROM "User" u
            WHERE (
              NOT EXISTS (
                SELECT 1 FROM "Session" s WHERE s."userId" = u.id AND s."updatedAt" > ${oneEightyDaysAgo}
              )
              OR NOT EXISTS (
                SELECT 1 FROM "Appointment" a WHERE a."customerId" = u.id AND a."requestedDate" > ${oneEightyDaysAgo}
              )
            )
            AND u.role = 'CUSTOMER'
            AND u."createdAt" < ${oneEightyDaysAgo}
          `;
          return Number(result?.[0]?.count ?? 0);
        } catch (err) {
          console.error("Failed to fetch churned users:", err);
          return 0;
        }
      })(),
      db.user.count({
        where: {
          suspendedAt: { not: null },
          OR: [{ suspendedUntil: null }, { suspendedUntil: { gt: now } }],
        },
      }),
    ]);

    const businessCounts: Record<string, number> = {};
    for (const row of businessesByStatus) {
      businessCounts[row.status] = row._count.id;
    }

    const userCounts: Record<string, number> = {};
    for (const row of usersByRole) {
      userCounts[row.role] = row._count.id;
    }

    const reviewStatusCounts: Record<string, number> = {};
    for (const row of reviewsByStatus) {
      reviewStatusCounts[row.status] = row._count.id;
    }

    const postStatusCounts: Record<string, number> = {};
    for (const row of postsByStatus) {
      postStatusCounts[row.status] = row._count.id;
    }

    const postContentTypeCounts: Record<string, number> = {};
    for (const row of postsByContentType) {
      postContentTypeCounts[row.contentType] = row._count.id;
    }

    const mediaStatusCounts: Record<string, number> = {};
    for (const row of mediaByStatus) {
      mediaStatusCounts[row.status] = row._count.id;
    }

    return {
      businessCounts,
      userCounts,
      reviewStatusCounts,
      postStatusCounts,
      postContentTypeCounts,
      mediaStatusCounts,
      totalBusinesses: Object.values(businessCounts).reduce((a, b) => a + b, 0),
      totalUsers: Object.values(userCounts).reduce((a, b) => a + b, 0),
      pendingApprovals: businessCounts["PENDING_APPROVAL"] ?? 0,
      appointmentsThisWeek,
      appointmentsLastWeek,
      hiddenMediaCount,
      pendingReviewCount,
      newUsersLast7d,
      newBusinessesLast7d,
      unverifiedUserCount,
      inactiveUserCount,
      churnedUserCount,
      suspendedUserCount,
      platformAvgRating: platformRatingStats._avg.rawAverage ?? null,
      pendingBusinessQueue: pendingBusinesses.map((b) => ({
        id: b.id,
        name: b.name,
        createdAt: b.createdAt.toISOString(),
        owner: b.owner,
      })),
      pendingReviewQueue: pendingReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        business: r.business,
        customer: r.customer,
      })),
      appointmentTrend: appointmentTrend.map((row) => ({
        day: (row.day as Date).toISOString().split("T")[0],
        status: row.status,
        count: row.count,
      })),
    };
  },
  [ADMIN_DASHBOARD_CACHE_TAG],
  { revalidate: 60, tags: [ADMIN_DASHBOARD_CACHE_TAG] }
);

export type AdminDashboardMetrics = Awaited<
  ReturnType<typeof getAdminDashboardMetrics>
>;

// ─── Helpers ───────────────────────────────────────────────────

async function getLastActivityDatesForBusinesses(businessIds: string[]) {
  if (businessIds.length === 0) return new Map<string, Date | null>();

  const results = await db.$queryRaw<
    Array<{ businessId: string; lastActivityAt: Date | null }>
  >`
    SELECT b.id as "businessId",
      GREATEST(
        MAX(a."createdAt"),
        MAX(r."createdAt"),
        MAX(p."createdAt")
      ) as "lastActivityAt"
    FROM "Business" b
    LEFT JOIN "Appointment" a ON a."businessId" = b.id
    LEFT JOIN "Review" r ON r."businessId" = b.id
    LEFT JOIN "Post" p ON p."businessId" = b.id
    WHERE b.id = ANY(${businessIds}::text[])
    GROUP BY b.id
  `;

  const map = new Map<string, Date | null>();
  for (const row of results) {
    map.set(row.businessId, row.lastActivityAt);
  }
  return map;
}

// ─── Businesses ────────────────────────────────────────────────

export async function getAdminBusinesses(statusFilter?: BusinessStatus) {
  const businesses = await db.business.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      owner: { select: { email: true, firstName: true, lastName: true } },
      categories: {
        include: { category: { select: { name: true, id: true } } },
      },
      services: {
        where: { isActive: true },
        select: { id: true },
      },
      hours: {
        where: { isOpen: true },
        select: { id: true },
      },
      media: {
        where: {
          type: { in: ["PORTFOLIO_IMAGE", "PORTFOLIO_VIDEO", "BEFORE_AFTER"] },
        },
        select: { id: true },
      },
      ratingStats: {
        select: {
          bayesianScore: true,
          rawReviewCount: true,
          recentReviewCount: true,
        },
      },
      _count: {
        select: {
          appointments: true,
          reviews: true,
          media: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const businessIds = businesses.map((b) => b.id);
  const [lastActivityMap, violationHistories] = await Promise.all([
    getLastActivityDatesForBusinesses(businessIds),
    getViolationHistoriesForBusinesses(businessIds),
  ]);

  return businesses.map((b) => ({
    ...b,
    lastActivityAt: lastActivityMap.get(b.id) ?? null,
    priorViolations: violationHistories.get(b.id)?.total ?? 0,
    violationsByType: violationHistories.get(b.id)?.byType ?? { reviews: 0, media: 0, posts: 0 },
  }));
}

export async function getViolationHistoriesForBusinesses(businessIds: string[]) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const violations = await db.adminAction.findMany({
    where: {
      targetId: { in: businessIds },
      action: {
        in: ["review.hide", "review.remove", "media.hide", "media.remove", "post.set_status"],
      },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { targetId: true, action: true, details: true },
  });

  const violationMap = new Map<
    string,
    { total: number; byType: { reviews: number; media: number; posts: number } }
  >();

  for (const violation of violations) {
    // Filter: only count post.set_status when details contains HIDDEN or REMOVED
    if (violation.action === "post.set_status" && violation.details) {
      if (!violation.details.includes("HIDDEN") && !violation.details.includes("REMOVED")) {
        continue; // Skip post status changes to ACTIVE or other non-violating states
      }
    }

    if (!violationMap.has(violation.targetId)) {
      violationMap.set(violation.targetId, {
        total: 0,
        byType: { reviews: 0, media: 0, posts: 0 },
      });
    }

    const entry = violationMap.get(violation.targetId)!;
    entry.total += 1;

    if (violation.action.includes("review")) {
      entry.byType.reviews += 1;
    } else if (violation.action.includes("media")) {
      entry.byType.media += 1;
    } else if (violation.action.includes("post")) {
      entry.byType.posts += 1;
    }
  }

  return violationMap;
}

export type AdminBusiness = Awaited<
  ReturnType<typeof getAdminBusinesses>
>[number];

export async function getAdminBusinessDetail(businessId: string) {
  const [
    business,
    pendingReviewCount,
    hiddenMediaCount,
    lastAppointment,
    lastActivityMap,
  ] = await Promise.all([
    db.business.findUnique({
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
        services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        hours: { where: { isOpen: true } },
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
        posts: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            status: true,
            contentType: true,
            createdAt: true,
            _count: { select: { media: true, saves: true } },
          },
        },
        ratingStats: {
          select: {
            bayesianScore: true,
            rawReviewCount: true,
            recentReviewCount: true,
            weightedAverage: true,
            effectiveReviewCount: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            reviews: true,
            media: true,
          },
        },
      },
    }),
    db.review.count({
      where: { businessId, status: "PENDING" },
    }),
    db.businessMedia.count({
      where: { businessId, status: "HIDDEN" },
    }),
    db.appointment.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true },
    }),
    getLastActivityDatesForBusinesses([businessId]),
  ]);

  if (!business) return null;

  return {
    ...business,
    pendingReviewCount,
    hiddenMediaCount,
    lastAppointment,
    lastActivityAt: lastActivityMap.get(businessId) ?? null,
  };
}

export type AdminBusinessDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminBusinessDetail>>
>;

export async function getBusinessActionHistory(businessId: string) {
  return db.adminAction.findMany({
    where: { targetType: "Business", targetId: businessId },
    include: {
      admin: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getEntityActionHistory(
  targetType: string,
  targetId: string,
  take = 20
) {
  return db.adminAction.findMany({
    where: { targetType, targetId },
    include: {
      admin: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getOffenderHistory(businessId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // First get all relevant entities for this business
  const entityTargetIds = (
    await db.adminAction.findMany({
      where: {
        targetType: "Business",
        targetId: businessId,
      },
      select: { targetId: true },
      distinct: ["targetId"],
    })
  ).map((a) => a.targetId);

  // Fetch all violations (including details for filtering post.set_status)
  const violations = await db.adminAction.findMany({
    where: {
      targetType: { in: ["Review", "BusinessMedia", "Post"] },
      targetId: { in: entityTargetIds },
      action: { in: ["review.hide", "review.remove", "media.hide", "media.remove", "post.set_status"] },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { action: true, details: true },
  });

  const violationsByType: Record<string, number> = {
    reviews: 0,
    media: 0,
    posts: 0,
  };

  for (const violation of violations) {
    // Filter: only count post.set_status when details contains HIDDEN or REMOVED
    if (violation.action === "post.set_status" && violation.details) {
      if (!violation.details.includes("HIDDEN") && !violation.details.includes("REMOVED")) {
        continue;
      }
    }

    if (violation.action.includes("review")) {
      violationsByType.reviews += 1;
    } else if (violation.action.includes("media")) {
      violationsByType.media += 1;
    } else if (violation.action.includes("post")) {
      violationsByType.posts += 1;
    }
  }

  const totalViolations = Object.values(violationsByType).reduce((a, b) => a + b, 0);

  return {
    total: totalViolations,
    byType: violationsByType,
    period: "30days",
  };
}

// ─── Users ─────────────────────────────────────────────────────

import type { LifecycleSegment } from "@/lib/admin/user-lifecycle";
import {
  computeUserLifecycle,
  type AdminUserLifecycleData,
} from "@/lib/admin/user-lifecycle";

export interface AdminUsersFilter {
  search?: string;
  roleFilter?: UserRole;
  lifecycle?: LifecycleSegment;
  page?: number;
  pageSize?: number;
}

export async function getAdminUsers(filter?: AdminUsersFilter) {
  const pageSize = filter?.pageSize ?? 50;
  const page = filter?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {};

  if (filter?.roleFilter) {
    where.role = filter.roleFilter;
  }

  if (filter?.search) {
    where.OR = [
      { firstName: { contains: filter.search, mode: "insensitive" } },
      { lastName: { contains: filter.search, mode: "insensitive" } },
      { email: { contains: filter.search, mode: "insensitive" } },
      { name: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        suspendedAt: true,
        suspendedUntil: true,
        suspensionReason: true,
        business: {
          select: { id: true, name: true, slug: true, status: true },
        },
        preferences: {
          select: {
            emailMarketing: true,
            marketingConsentAt: true,
            consentVersion: true,
            affinityComputedAt: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            favorites: true,
            postSaves: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.user.count({ where }),
  ]);

  // Fetch last login and appointment data for each user
  const userIds = users.map((u) => u.id);
  const [lastLoginMap, appointmentDataMap] = await Promise.all([
    getLastLoginDatesForUsers(userIds),
    getAppointmentDataForUsers(userIds),
  ]);

  // Enrich users with lifecycle and computed fields
  const enrichedUsers = users.map((user) => {
    const appointmentData = appointmentDataMap.get(user.id) ?? {
      total: 0,
      completed: 0,
      lastDate: null,
    };
    const lastLoginAt = lastLoginMap.get(user.id) ?? null;

    const lifecycleData: AdminUserLifecycleData = {
      id: user.id,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt,
      appointmentCount: appointmentData.total,
      completedAppointmentCount: appointmentData.completed,
      lastAppointmentDate: appointmentData.lastDate,
      suspendedAt: user.suspendedAt,
      suspendedUntil: user.suspendedUntil,
      businessStatus: user.business?.status ?? null,
      businessLastActivityAt: undefined, // Will fetch separately if needed
    };

    const lifecycle = computeUserLifecycle(lifecycleData);

    return {
      ...user,
      lastLoginAt,
      appointmentCount: appointmentData.total,
      completedAppointmentCount: appointmentData.completed,
      lastAppointmentDate: appointmentData.lastDate,
      lifecycle,
    };
  });

  // Filter by lifecycle if requested
  let filtered = enrichedUsers;
  if (filter?.lifecycle) {
    filtered = enrichedUsers.filter((u) => u.lifecycle === filter.lifecycle);
  }

  // Use filtered count for pagination when lifecycle filter is active
  const displayTotal = filter?.lifecycle ? filtered.length : total;

  return {
    items: filtered,
    total: displayTotal,
    rawTotal: total,
    page,
    pageSize,
    pageCount: Math.ceil(displayTotal / pageSize),
  };
}

async function getLastLoginDatesForUsers(
  userIds: string[]
): Promise<Map<string, Date | null>> {
  if (userIds.length === 0) return new Map();

  const results = await db.$queryRaw<
    Array<{ userId: string; lastLoginAt: Date | null }>
  >`
    SELECT "userId", MAX("updatedAt") as "lastLoginAt"
    FROM "Session"
    WHERE "userId" = ANY(${userIds}::text[])
    GROUP BY "userId"
  `;

  const map = new Map<string, Date | null>();
  for (const row of results) {
    map.set(row.userId, row.lastLoginAt);
  }

  // Ensure all users have an entry (even if null)
  for (const userId of userIds) {
    if (!map.has(userId)) {
      map.set(userId, null);
    }
  }

  return map;
}

interface AppointmentData {
  total: number;
  completed: number;
  lastDate: Date | null;
}

async function getAppointmentDataForUsers(
  userIds: string[]
): Promise<Map<string, AppointmentData>> {
  if (userIds.length === 0) return new Map();

  const results = await db.$queryRaw<
    Array<{
      customerId: string;
      total: number;
      completed: number;
      lastDate: Date | null;
    }>
  >`
    SELECT
      "customerId",
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
      MAX("requestedDate") as "lastDate"
    FROM "Appointment"
    WHERE "customerId" = ANY(${userIds}::text[])
    GROUP BY "customerId"
  `;

  const map = new Map<string, AppointmentData>();
  for (const row of results) {
    map.set(row.customerId, {
      total: Number(row.total),
      completed: Number(row.completed),
      lastDate: row.lastDate,
    });
  }

  // Ensure all users have an entry
  for (const userId of userIds) {
    if (!map.has(userId)) {
      map.set(userId, { total: 0, completed: 0, lastDate: null });
    }
  }

  return map;
}

export type AdminUser = Awaited<ReturnType<typeof getAdminUsers>>["items"][number];

export async function getAdminUserActionHistory(userId: string) {
  return db.adminAction.findMany({
    where: { targetType: "User", targetId: userId },
    include: {
      admin: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export type AdminUserAction = Awaited<
  ReturnType<typeof getAdminUserActionHistory>
>[number];

export async function getAdminUserDetail(userId: string) {
  const [
    user,
    appointments,
    engagement,
    actions,
    consentLogs,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
          },
        },
        preferences: true,
        twoFactor: {
          select: {
            id: true,
          },
        },
        sessions: {
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            createdAt: true,
            updatedAt: true,
            ipAddress: true,
            userAgent: true,
          },
        },
      },
    }),
    db.appointment.findMany({
      where: { customerId: userId },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        service: { select: { name: true } },
      },
      orderBy: { requestedDate: "desc" },
      take: 10,
    }),
    (async () => {
      const [favorites, saves, saveDetails] = await Promise.all([
        db.favorite.count({ where: { userId } }),
        db.postSave.count({ where: { userId } }),
        db.postSave.findMany({
          where: { userId },
          include: {
            post: {
              select: {
                id: true,
                contentType: true,
                business: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);
      return { favorites, saves, saveDetails };
    })(),
    getAdminUserActionHistory(userId),
    db.consentAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!user) return null;

  return {
    user,
    appointments,
    engagement,
    actions,
    consentLogs,
  };
}

export type AdminUserDetail = Awaited<
  ReturnType<typeof getAdminUserDetail>
>;

// ─── Appointments ──────────────────────────────────────────────

export type AdminAppointmentFilter = {
  statuses?: AppointmentStatus[];
  businessName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  stuckMinHours?: number;
  page?: number;
  pageSize?: number;
};

export async function getAdminAppointments(filter?: AdminAppointmentFilter) {
  const pageSize = filter?.pageSize ?? 50;
  const page = filter?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where: Prisma.AppointmentWhereInput = {};

  if (filter?.statuses && filter.statuses.length > 0) {
    where.status = { in: filter.statuses };
  }

  if (filter?.businessName) {
    where.business = {
      name: { contains: filter.businessName, mode: "insensitive" },
    };
  }

  if (filter?.dateFrom || filter?.dateTo) {
    where.requestedDate = {};
    if (filter?.dateFrom) {
      where.requestedDate.gte = filter.dateFrom;
    }
    if (filter?.dateTo) {
      where.requestedDate.lte = filter.dateTo;
    }
  }

  if (filter?.stuckMinHours && filter?.stuckMinHours > 0) {
    const stuckBefore = new Date(
      Date.now() - filter.stuckMinHours * 60 * 60 * 1000
    );
    where.createdAt = { lt: stuckBefore };
    where.status = "PENDING";
  }

  const [items, total] = await Promise.all([
    db.appointment.findMany({
      where,
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
        business: { select: { id: true, name: true, slug: true } },
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.appointment.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export type AdminAppointment = Awaited<
  ReturnType<typeof getAdminAppointments>
>["items"][number];

export async function getAdminPendingQueue() {
  return db.appointment.findMany({
    where: { status: "PENDING" },
    include: {
      customer: {
        select: { firstName: true, lastName: true, email: true },
      },
      business: { select: { id: true, name: true, slug: true } },
      service: { select: { name: true, durationMinutes: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type AdminPendingAppointment = Awaited<
  ReturnType<typeof getAdminPendingQueue>
>[number];

export async function getAdminAppointmentDetail(id: string) {
  const [appointment, auditLogs] = await Promise.all([
    db.appointment.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        business: {
          select: { id: true, name: true, slug: true },
        },
        service: {
          select: { name: true, durationMinutes: true, priceType: true, price: true },
        },
        professional: {
          select: { displayName: true, title: true },
        },
        review: {
          select: { rating: true, comment: true, status: true, createdAt: true },
        },
      },
    }),
    db.adminAction.findMany({
      where: { targetId: id, targetType: "Appointment" },
      include: { admin: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!appointment) return null;
  return { appointment, auditLogs };
}

export type AdminAppointmentDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminAppointmentDetail>>
>;

export async function getAdminAppointmentStats() {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [statusCounts, stuck6h, stuck24h, completedTotal, noShowTotal] =
    await Promise.all([
      db.appointment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      db.appointment.count({
        where: { status: "PENDING", createdAt: { lt: sixHoursAgo } },
      }),
      db.appointment.count({
        where: { status: "PENDING", createdAt: { lt: twentyFourHoursAgo } },
      }),
      db.appointment.count({
        where: { status: "COMPLETED" },
      }),
      db.appointment.count({
        where: { status: "NO_SHOW" },
      }),
    ]);

  const counts: Record<AppointmentStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    CHECKED_IN: 0,
    REJECTED: 0,
    CANCELLED_BY_CUSTOMER: 0,
    CANCELLED_BY_BUSINESS: 0,
    COMPLETED: 0,
    NO_SHOW: 0,
  };

  for (const row of statusCounts) {
    counts[row.status as AppointmentStatus] = row._count.id;
  }

  const noShowRate =
    completedTotal + noShowTotal > 0
      ? Math.round((noShowTotal / (completedTotal + noShowTotal)) * 100)
      : 0;

  return {
    pending: counts.PENDING,
    confirmed: counts.CONFIRMED,
    rejected: counts.REJECTED,
    cancelledByCustomer: counts.CANCELLED_BY_CUSTOMER,
    cancelledByBusiness: counts.CANCELLED_BY_BUSINESS,
    completed: counts.COMPLETED,
    noShow: counts.NO_SHOW,
    stuck6h,
    stuck24h,
    noShowRate7d: noShowRate,
  };
}

export async function getAdminBusinessMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Aggregate by business and status for 30-day window
  const stats = await db.appointment.groupBy({
    by: ["businessId", "status"],
    _count: { id: true },
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // Get all businesses with appointments
  const businessIds = Array.from(new Set(stats.map((s) => s.businessId)));

  const businesses = await db.business.findMany({
    where: { id: { in: businessIds } },
    select: { id: true, name: true, slug: true },
  });

  // Calculate response time via raw SQL
  const responseTimeData = await db.$queryRaw<
    { businessId: string; avgSeconds: number }[]
  >`
    SELECT
      "businessId",
      EXTRACT(EPOCH FROM AVG("updatedAt" - "createdAt"))::int as "avgSeconds"
    FROM "Appointment"
    WHERE "status" IN ('CONFIRMED', 'REJECTED')
      AND "createdAt" >= NOW() - INTERVAL '30 days'
    GROUP BY "businessId"
  `;

  const responseTimeMap = new Map(
    responseTimeData.map((d) => [d.businessId, d.avgSeconds])
  );

  // Build result with metrics per business
  const result = businesses.map((business) => {
    const businessStats = stats.filter((s) => s.businessId === business.id);

    const pending =
      businessStats.find((s) => s.status === "PENDING")?._count.id ?? 0;
    const confirmed =
      businessStats.find((s) => s.status === "CONFIRMED")?._count.id ?? 0;
    const rejected =
      businessStats.find((s) => s.status === "REJECTED")?._count.id ?? 0;
    const completed =
      businessStats.find((s) => s.status === "COMPLETED")?._count.id ?? 0;
    const noShow =
      businessStats.find((s) => s.status === "NO_SHOW")?._count.id ?? 0;
    const cancelledByCustomer =
      businessStats.find((s) => s.status === "CANCELLED_BY_CUSTOMER")?._count
        .id ?? 0;
    const cancelledByBusiness =
      businessStats.find((s) => s.status === "CANCELLED_BY_BUSINESS")?._count
        .id ?? 0;

    const totalResponses = confirmed + rejected;
    const acceptanceRate =
      totalResponses > 0
        ? Math.round((confirmed / totalResponses) * 100)
        : 0;

    const rejectionRate =
      totalResponses > 0
        ? Math.round((rejected / totalResponses) * 100)
        : 0;

    const totalCompleted = completed + noShow;
    const noShowRate =
      totalCompleted > 0
        ? Math.round((noShow / totalCompleted) * 100)
        : 0;

    const avgResponseSeconds = responseTimeMap.get(business.id) ?? 0;
    const avgResponseHours = Math.round(avgResponseSeconds / 3600);

    return {
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      pending,
      confirmed,
      rejected,
      completed,
      noShow,
      cancelledByCustomer,
      cancelledByBusiness,
      acceptanceRate,
      rejectionRate,
      noShowRate,
      avgResponseHours,
    };
  });

  return result.sort((a, b) => b.pending - a.pending);
}

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

// ─── Posts ─────────────────────────────────────────────────────

export async function getAdminPosts(opts?: {
  contentType?: PostContentType;
  status?: PostStatus;
  cursor?: string;
  take?: number;
}) {
  const take = opts?.take ?? 50;

  return db.post.findMany({
    where: {
      ...(opts?.contentType ? { contentType: opts.contentType } : {}),
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.cursor ? { createdAt: { lt: new Date(opts.cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      contentType: true,
      status: true,
      description: true,
      createdAt: true,
      business: { select: { id: true, name: true, slug: true } },
      _count: { select: { media: true, saves: true } },
    },
  });
}

export type AdminPost = Awaited<ReturnType<typeof getAdminPosts>>[number];

// ─── Marketing & Campaigns ────────────────────────────────────

export interface MarketingAudienceFilters {
  roles?: UserRole[];
  businessStatuses?: BusinessStatus[];
  cities?: string[];
  categoryIds?: string[];
  locales?: string[];
  activeWithinDays?: number;
}

export async function getEmailMarketingAudience(filters?: MarketingAudienceFilters) {
  const andFilters: Prisma.UserWhereInput[] = [
    // Marketing consent must be active
    {
      preferences: {
        marketingConsentAt: { not: null },
        marketingRevokedAt: null,
        emailMarketing: true,
      },
    },
    // Email must be verified
    {
      emailVerified: true,
    },
  ];
  const where: Prisma.UserWhereInput = { AND: andFilters };

  // Role filter
  if (filters?.roles && filters.roles.length > 0) {
    where.role = { in: filters.roles };
  }

  // Locale filter
  if (filters?.locales && filters.locales.length > 0) {
    andFilters.push({ preferences: { locale: { in: filters.locales } } });
  }

  // Active within N days
  if (filters?.activeWithinDays && filters.activeWithinDays > 0) {
    const dateThreshold = new Date(Date.now() - filters.activeWithinDays * 24 * 60 * 60 * 1000);
    where.appointments = {
      some: {
        createdAt: { gte: dateThreshold },
      },
    };
  }

  // For business owners: filter by business status and city/category
  if (filters?.businessStatuses && filters.businessStatuses.length > 0) {
    where.business = {
      status: { in: filters.businessStatuses },
    };
  }

  if (filters?.cities && filters.cities.length > 0) {
    if (where.business) {
      where.business.city = { in: filters.cities };
    } else {
      where.business = {
        city: { in: filters.cities },
      };
    }
  }

  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    if (where.business) {
      where.business.categories = {
        some: { categoryId: { in: filters.categoryIds } },
      };
    } else {
      where.business = {
        categories: {
          some: { categoryId: { in: filters.categoryIds } },
        },
      };
    }
  }

  return db.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      preferences: {
        select: {
          locale: true,
          marketingConsentAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type EmailMarketingAudienceMember = Awaited<
  ReturnType<typeof getEmailMarketingAudience>
>[number];

export async function getWhatsAppMarketingAudience(filters?: MarketingAudienceFilters) {
  const andFilters: Prisma.UserWhereInput[] = [
    // Marketing consent must be active
    {
      preferences: {
        marketingConsentAt: { not: null },
        marketingRevokedAt: null,
        whatsappMarketing: true,
      },
    },
    // Phone must be present and valid
    {
      OR: [
        {
          phone: { not: null },
        },
        {
          business: {
            whatsapp: { not: null },
          },
        },
      ],
    },
  ];
  const where: Prisma.UserWhereInput = { AND: andFilters };

  // Role filter
  if (filters?.roles && filters.roles.length > 0) {
    where.role = { in: filters.roles };
  }

  // Locale filter
  if (filters?.locales && filters.locales.length > 0) {
    andFilters.push({ preferences: { locale: { in: filters.locales } } });
  }

  // Active within N days
  if (filters?.activeWithinDays && filters.activeWithinDays > 0) {
    const dateThreshold = new Date(Date.now() - filters.activeWithinDays * 24 * 60 * 60 * 1000);
    where.appointments = {
      some: {
        createdAt: { gte: dateThreshold },
      },
    };
  }

  // For business owners: filter by business status and city/category
  if (filters?.businessStatuses && filters.businessStatuses.length > 0) {
    where.business = {
      status: { in: filters.businessStatuses },
    };
  }

  if (filters?.cities && filters.cities.length > 0) {
    if (where.business) {
      where.business.city = { in: filters.cities };
    } else {
      where.business = {
        city: { in: filters.cities },
      };
    }
  }

  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    if (where.business) {
      where.business.categories = {
        some: { categoryId: { in: filters.categoryIds } },
      };
    } else {
      where.business = {
        categories: {
          some: { categoryId: { in: filters.categoryIds } },
        },
      };
    }
  }

  return db.user.findMany({
    where,
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      business: {
        select: {
          id: true,
          whatsapp: true,
        },
      },
      preferences: {
        select: {
          locale: true,
          marketingConsentAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type WhatsAppMarketingAudienceMember = Awaited<
  ReturnType<typeof getWhatsAppMarketingAudience>
>[number];

export async function getCampaigns(filters?: { status?: string; limit?: number }) {
  const where: Prisma.CampaignWhereInput = filters?.status
    ? { status: filters.status as CampaignStatus }
    : {};
  return db.campaign.findMany({
    where,
    include: {
      createdBy: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit,
  });
}

export type AdminCampaign = Awaited<ReturnType<typeof getCampaigns>>[number];

export async function getCampaignDetail(campaignId: string) {
  return db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      createdBy: { select: { firstName: true, lastName: true, email: true } },
      recipients: {
        select: {
          id: true,
          userId: true,
          recipientEmail: true,
          recipientPhone: true,
          status: true,
          errorMessage: true,
          sentAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export type AdminCampaignDetail = Awaited<ReturnType<typeof getCampaignDetail>>;

// ─── PlaceReference ─────────────────────────────────────────────

const VALID_PLACE_REFERENCE_STATUSES = new Set<PlaceReferenceStatus>([
  "DISCOVERED",
  "APPROVED",
  "HIDDEN",
  "DUPLICATE",
  "CLAIM_PENDING",
  "CLAIMED",
  "REJECTED",
  "STALE",
  "ERROR",
]);

export function isValidPlaceReferenceStatus(
  value: unknown
): value is PlaceReferenceStatus {
  return (
    typeof value === "string" &&
    VALID_PLACE_REFERENCE_STATUSES.has(value as PlaceReferenceStatus)
  );
}

export async function getAdminPlaceReferences(params?: {
  status?: PlaceReferenceStatus;
  city?: string;
}) {
  return db.placeReference.findMany({
    where: {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.city ? { city: params.city } : {}),
    },
    include: {
      claimedBusiness: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export type AdminPlaceReference = Awaited<
  ReturnType<typeof getAdminPlaceReferences>
>[number];

export async function getApprovedUnclaimedPlaceReferences() {
  return db.placeReference.findMany({
    where: { status: "APPROVED", claimedBusinessId: null },
    select: {
      id: true,
      provider: true,
      providerPlaceId: true,
      city: true,
      district: true,
      categoryHint: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Claim Requests ─────────────────────────────────────────────

const VALID_CLAIM_REQUEST_STATUSES = new Set<ClaimRequestStatus>([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export function isValidClaimRequestStatus(
  value: unknown
): value is ClaimRequestStatus {
  return (
    typeof value === "string" &&
    VALID_CLAIM_REQUEST_STATUSES.has(value as ClaimRequestStatus)
  );
}

export async function getAdminClaimRequests(params?: {
  status?: ClaimRequestStatus;
}) {
  return db.businessClaimRequest.findMany({
    where: {
      ...(params?.status ? { status: params.status } : {}),
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      placeReference: {
        select: {
          id: true,
          city: true,
          district: true,
          categoryHint: true,
          provider: true,
          status: true,
          claimedBusinessId: true,
        },
      },
      business: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export type AdminClaimRequest = Awaited<
  ReturnType<typeof getAdminClaimRequests>
>[number];
