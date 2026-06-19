import { connection } from "next/server";
import { getAdminDashboardMetrics, getRecentAdminActions } from "@/lib/queries/admin";
import { PageHeader } from "@/components/ui/page-header";
import { KpiGrid } from "@/components/admin/dashboard/kpi-grid";
import { AlertStrip } from "@/components/admin/dashboard/alert-strip";
import { PendingBusinessQueue } from "@/components/admin/dashboard/pending-business-queue";
import { PendingReviewQueue } from "@/components/admin/dashboard/pending-review-queue";
import { AppointmentTrendChart } from "@/components/admin/dashboard/appointment-trend-chart";
import { BusinessStatusChart } from "@/components/admin/dashboard/business-status-chart";
import { PlatformHealthRow } from "@/components/admin/dashboard/platform-health-row";
import { AdminActivityFeed } from "@/components/admin/dashboard/admin-activity-feed";
import {
  buildAppointmentTrendData,
  buildBusinessStatusChartData,
} from "./_lib/transforms";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  // Admin metrics depend on live database state and should never run at build time.
  await connection();

  let metrics;
  
  const [recentActions] = await Promise.all([
    getRecentAdminActions(10),
  ]);

  try {
    metrics = await getAdminDashboardMetrics();
  } catch (err) {
    console.error("[admin:dashboard] Failed to fetch metrics:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error loading metrics";
    // If metrics completely fail, return error page
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Control Tower"
          description="Real-time platform health and pending actions."
        />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Dashboard Unavailable
          </h2>
          <p className="text-sm text-destructive/80 mb-4">
            {message}
          </p>
          <p className="text-xs text-destructive/60">
            Try refreshing the page or contact support if this persists.
          </p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const appointmentTrendData = buildAppointmentTrendData(
    metrics.appointmentTrend
  );
  const businessStatusData = buildBusinessStatusChartData(
    metrics.businessCounts
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Control Tower"
        description="Real-time platform health and pending actions."
      />

      <KpiGrid metrics={metrics} />

      <AlertStrip
        pendingApprovals={metrics.pendingApprovals}
        pendingReviews={metrics.pendingReviewCount}
        hiddenPosts={
          (metrics.postStatusCounts["HIDDEN"] ?? 0) +
          (metrics.postStatusCounts["REMOVED"] ?? 0)
        }
        hiddenMedia={metrics.hiddenMediaCount}
        suspendedBusinesses={metrics.businessCounts["SUSPENDED"] ?? 0}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PendingBusinessQueue items={metrics.pendingBusinessQueue} />
        <PendingReviewQueue items={metrics.pendingReviewQueue} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppointmentTrendChart data={appointmentTrendData} />
        <BusinessStatusChart data={businessStatusData} />
      </div>

      <PlatformHealthRow metrics={metrics} />

      <AdminActivityFeed actions={recentActions} />
    </div>
  );
}
