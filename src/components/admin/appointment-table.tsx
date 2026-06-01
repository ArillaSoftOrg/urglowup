import { getAdminAppointments } from "@/lib/queries/admin";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants/booking";
import { AppointmentTableClient } from "./appointment-table-client";
import type { AdminAppointmentFilter } from "@/lib/queries/admin";

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAge(createdAt: Date): string {
  const now = new Date();
  const ageMs = now.getTime() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours < 1) return `${Math.round(ageHours * 60)}m`;
  if (ageHours < 24) return `${Math.round(ageHours)}h`;
  return `${Math.round(ageHours / 24)}d`;
}

interface AppointmentTableProps {
  filter?: AdminAppointmentFilter;
}

export async function AppointmentTable({ filter }: AppointmentTableProps) {
  const result = await getAdminAppointments(filter);

  return (
    <AppointmentTableClient
      appointments={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      pageCount={result.pageCount}
      formatDate={formatDate}
      formatAge={formatAge}
      statusLabels={STATUS_LABELS}
      statusColors={STATUS_COLORS}
    />
  );
}
