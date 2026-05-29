import type { AdminDashboardMetrics } from "@/lib/queries/admin";
import type { AppointmentTrendPoint } from "@/components/admin/dashboard/appointment-trend-chart";
import type { BusinessStatusPoint } from "@/components/admin/dashboard/business-status-chart";
import type { BusinessStatus } from "@/generated/prisma/enums";
import { BUSINESS_STATUS_LABELS } from "@/lib/constants/business";

export function buildAppointmentTrendData(
  rawTrend: AdminDashboardMetrics["appointmentTrend"]
): AppointmentTrendPoint[] {
  if (!rawTrend || rawTrend.length === 0) {
    return [];
  }

  // Build a map of day -> status counts
  const dayMap = new Map<string, Record<string, number>>();

  for (const row of rawTrend) {
    const day = row.day; // ISO string "2025-05-21"
    if (!dayMap.has(day)) {
      dayMap.set(day, { PENDING: 0, CONFIRMED: 0, COMPLETED: 0 });
    }
    const dayData = dayMap.get(day)!;
    dayData[row.status as keyof typeof dayData] = row.count;
  }

  // Fill in missing days in the 7-day range
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const result: AppointmentTrendPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStr = date.toISOString().split("T")[0];

    const dayData = dayMap.get(dayStr) || {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
    };

    result.push({
      day: dayStr,
      PENDING: dayData.PENDING || 0,
      CONFIRMED: dayData.CONFIRMED || 0,
      COMPLETED: dayData.COMPLETED || 0,
    });
  }

  return result;
}

export function buildBusinessStatusChartData(
  businessCounts: Record<string, number>
): BusinessStatusPoint[] {
  const statuseses: BusinessStatus[] = [
    "DRAFT",
    "PENDING_APPROVAL",
    "ACTIVE_PRIVATE",
    "ACTIVE_MARKETPLACE",
    "SUSPENDED",
    "REJECTED",
  ];

  return statuseses
    .map((status) => ({
      status,
      count: businessCounts[status] ?? 0,
      label: BUSINESS_STATUS_LABELS[status],
    }))
    .filter((item) => item.count > 0);
}
