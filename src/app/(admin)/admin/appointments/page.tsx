import { Suspense } from "react";
import { AppointmentsStatsBar } from "@/components/admin/appointments-stats-bar";
import { PendingQueue } from "@/components/admin/pending-queue";
import { AppointmentTable } from "@/components/admin/appointment-table";
import { BusinessAppointmentMetrics } from "@/components/admin/business-appointment-metrics";
import { AppointmentPageTabs } from "@/components/admin/appointment-page-client";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Admin - Appointments" };

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Parse filter from search params
  const statusesParam = typeof params.statuses === "string" ? params.statuses : "";
  const statuses = statusesParam
    ? (statusesParam.split(",") as AppointmentStatus[])
    : undefined;

  const businessName =
    typeof params.businessName === "string" ? params.businessName : undefined;
  const pageParam = typeof params.page === "string" ? params.page : "1";
  const page = parseInt(pageParam, 10) || 1;

  const filter = {
    statuses,
    businessName,
    page,
    pageSize: 50,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments Operations Console</h1>
        <p className="text-slate-600">
          Monitor pending queues, conversion metrics, and triage stuck appointments.
        </p>
      </div>

      <Suspense fallback={<div className="h-20 bg-slate-100 rounded" />}>
        <AppointmentsStatsBar />
      </Suspense>

      <AppointmentPageTabs
        pendingQueue={
          <Suspense fallback={<div className="h-64 bg-slate-100 rounded" />}>
            <PendingQueue />
          </Suspense>
        }
        allAppointments={
          <Suspense fallback={<div className="h-96 bg-slate-100 rounded" />}>
            <AppointmentTable filter={filter} />
          </Suspense>
        }
        businessMetrics={
          <Suspense fallback={<div className="h-96 bg-slate-100 rounded" />}>
            <BusinessAppointmentMetrics />
          </Suspense>
        }
      />
    </div>
  );
}
