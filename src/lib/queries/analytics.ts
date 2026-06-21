import { db } from "@/lib/db";

export type Period = "30d" | "90d" | "12m";

function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === "30d") return new Date(now.getTime() - 30 * 86400_000);
  if (period === "90d") return new Date(now.getTime() - 90 * 86400_000);
  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
}

// ─── Revenue ─────────────────────────────────────────────────────

export async function getRevenueTimeSeries(businessId: string, period: Period) {
  const since = getPeriodStart(period);
  const groupBy = period === "12m" ? "month" : "day";

  const rows = await db.$queryRaw<{ bucket: Date; revenue: number; count: number }[]>`
    SELECT
      DATE_TRUNC(${groupBy}, a."requestedDate") AS bucket,
      COALESCE(SUM(s.price), 0)::float          AS revenue,
      COUNT(a.id)::int                          AS count
    FROM "Appointment" a
    JOIN "BusinessService" s ON a."serviceId" = s.id
    WHERE a."businessId" = ${businessId}
      AND a.status = 'COMPLETED'
      AND a."requestedDate" >= ${since}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  return rows.map((r) => ({
    bucket: r.bucket.toISOString().slice(0, period === "12m" ? 7 : 10),
    revenue: Number(r.revenue),
    count: Number(r.count),
  }));
}

export async function getRevenueSummary(businessId: string) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonth, lastMonth, allTime] = await Promise.all([
    db.$queryRaw<{ revenue: number; count: number }[]>`
      SELECT COALESCE(SUM(s.price), 0)::float AS revenue, COUNT(a.id)::int AS count
      FROM "Appointment" a JOIN "BusinessService" s ON a."serviceId" = s.id
      WHERE a."businessId" = ${businessId} AND a.status = 'COMPLETED'
        AND a."requestedDate" >= ${thisMonthStart}
    `,
    db.$queryRaw<{ revenue: number; count: number }[]>`
      SELECT COALESCE(SUM(s.price), 0)::float AS revenue, COUNT(a.id)::int AS count
      FROM "Appointment" a JOIN "BusinessService" s ON a."serviceId" = s.id
      WHERE a."businessId" = ${businessId} AND a.status = 'COMPLETED'
        AND a."requestedDate" >= ${lastMonthStart} AND a."requestedDate" < ${thisMonthStart}
    `,
    db.$queryRaw<{ revenue: number; count: number }[]>`
      SELECT COALESCE(SUM(s.price), 0)::float AS revenue, COUNT(a.id)::int AS count
      FROM "Appointment" a JOIN "BusinessService" s ON a."serviceId" = s.id
      WHERE a."businessId" = ${businessId} AND a.status = 'COMPLETED'
    `,
  ]);

  const tm = { revenue: Number(thisMonth[0]?.revenue ?? 0), count: Number(thisMonth[0]?.count ?? 0) };
  const lm = { revenue: Number(lastMonth[0]?.revenue ?? 0), count: Number(lastMonth[0]?.count ?? 0) };
  const at = { revenue: Number(allTime[0]?.revenue ?? 0), count: Number(allTime[0]?.count ?? 0) };
  const avg = tm.count > 0 ? tm.revenue / tm.count : 0;
  const revenueChange = lm.revenue > 0 ? ((tm.revenue - lm.revenue) / lm.revenue) * 100 : null;

  return { thisMonth: tm, lastMonth: lm, allTime: at, avgOrderValue: avg, revenueChange };
}

// ─── Funnel ──────────────────────────────────────────────────────

export async function getAppointmentFunnel(businessId: string, period: Period) {
  const since = getPeriodStart(period);
  const rows = await db.appointment.groupBy({
    by: ["status"],
    where: { businessId, createdAt: { gte: since } },
    _count: { id: true },
  });

  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r._count.id]));
  const total = Object.values(byStatus).reduce((s, c) => s + c, 0);
  const completed = byStatus["COMPLETED"] ?? 0;
  const confirmed = byStatus["CONFIRMED"] ?? 0;
  const pending = byStatus["PENDING"] ?? 0;
  const cancelled = (byStatus["CANCELLED_BY_CUSTOMER"] ?? 0) + (byStatus["CANCELLED_BY_BUSINESS"] ?? 0);
  const noShow = byStatus["NO_SHOW"] ?? 0;

  return {
    total,
    pending,
    confirmed,
    completed,
    cancelled,
    noShow,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
    noShowRate: total > 0 ? (noShow / total) * 100 : 0,
  };
}

// ─── Service Performance ─────────────────────────────────────────

export async function getServicePerformance(businessId: string, period: Period) {
  const since = getPeriodStart(period);
  const rows = await db.$queryRaw<{ name: string; count: number; revenue: number }[]>`
    SELECT
      s.name,
      COUNT(a.id)::int                          AS count,
      COALESCE(SUM(s.price), 0)::float          AS revenue
    FROM "Appointment" a
    JOIN "BusinessService" s ON a."serviceId" = s.id
    WHERE a."businessId" = ${businessId}
      AND a.status = 'COMPLETED'
      AND a."requestedDate" >= ${since}
    GROUP BY s.id, s.name
    ORDER BY revenue DESC
    LIMIT 10
  `;

  return rows.map((r) => ({
    name: r.name,
    count: Number(r.count),
    revenue: Number(r.revenue),
  }));
}

// ─── Peak Days ───────────────────────────────────────────────────

export async function getPeakDays(businessId: string, period: Period) {
  const since = getPeriodStart(period);
  const rows = await db.$queryRaw<{ dow: number; count: number }[]>`
    SELECT
      EXTRACT(DOW FROM "requestedDate")::int AS dow,
      COUNT(id)::int                        AS count
    FROM "Appointment"
    WHERE "businessId" = ${businessId}
      AND status = 'COMPLETED'
      AND "requestedDate" >= ${since}
    GROUP BY dow
    ORDER BY dow
  `;

  const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const map = Object.fromEntries(rows.map((r) => [r.dow, Number(r.count)]));
  return DAY_LABELS.map((label, i) => ({ day: label, count: map[i] ?? 0 }));
}

// ─── Customer Metrics ────────────────────────────────────────────

export async function getCustomerMetrics(businessId: string, period: Period) {
  const since = getPeriodStart(period);

  // Customers who had their FIRST appointment with this business in the period
  const newCustomers = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(DISTINCT a."customerId")::int AS count
    FROM "Appointment" a
    WHERE a."businessId" = ${businessId}
      AND a.status IN ('COMPLETED', 'CONFIRMED', 'PENDING')
      AND a."createdAt" >= ${since}
      AND NOT EXISTS (
        SELECT 1 FROM "Appointment" a2
        WHERE a2."businessId" = ${businessId}
          AND a2."customerId" = a."customerId"
          AND a2."createdAt" < ${since}
      )
  `;

  const returningCustomers = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(DISTINCT a."customerId")::int AS count
    FROM "Appointment" a
    WHERE a."businessId" = ${businessId}
      AND a.status IN ('COMPLETED', 'CONFIRMED', 'PENDING')
      AND a."createdAt" >= ${since}
      AND EXISTS (
        SELECT 1 FROM "Appointment" a2
        WHERE a2."businessId" = ${businessId}
          AND a2."customerId" = a."customerId"
          AND a2."createdAt" < ${since}
      )
  `;

  return {
    newCustomers: Number(newCustomers[0]?.count ?? 0),
    returningCustomers: Number(returningCustomers[0]?.count ?? 0),
  };
}

// ─── All-in-one ──────────────────────────────────────────────────

export async function getBusinessAnalytics(businessId: string, period: Period) {
  const [revenueSummary, revenueTimeSeries, funnel, servicePerformance, peakDays, customerMetrics] =
    await Promise.all([
      getRevenueSummary(businessId),
      getRevenueTimeSeries(businessId, period),
      getAppointmentFunnel(businessId, period),
      getServicePerformance(businessId, period),
      getPeakDays(businessId, period),
      getCustomerMetrics(businessId, period),
    ]);

  return { revenueSummary, revenueTimeSeries, funnel, servicePerformance, peakDays, customerMetrics };
}

export type BusinessAnalytics = Awaited<ReturnType<typeof getBusinessAnalytics>>;
