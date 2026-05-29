import { getAdminPendingQueue } from "@/lib/queries/admin";
import { BUSINESS_TIMEZONE } from "@/lib/constants/booking";
import { PendingQueueRow } from "./pending-queue-row";

export async function PendingQueue() {
  const appointments = await getAdminPendingQueue();

  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-slate-600">No pending appointments.</p>
      </div>
    );
  }

  // Compute age and urgency for each
  const enriched = appointments.map((appt) => {
    const createdAt = new Date(appt.createdAt);
    const now = new Date();
    const ageMs = now.getTime() - createdAt.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    // Approximate urgency check (48 hours from now)
    // Convert requestedDate to a date object for rough comparison
    const apptDate = new Date(appt.requestedDate);
    const nowDate = new Date();
    const daysUntilAppt = (apptDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24);
    const isUrgent = daysUntilAppt < 2 && daysUntilAppt > 0;

    return {
      ...appt,
      ageHours,
      isUrgent,
    };
  });

  // Age color helpers
  function getAgeColor(ageHours: number): string {
    if (ageHours < 2) return "bg-green-50 border-green-100";
    if (ageHours < 6) return "bg-yellow-50 border-yellow-100";
    if (ageHours < 24) return "bg-orange-50 border-orange-100";
    return "bg-red-50 border-red-100";
  }

  function getAgeBadgeColor(ageHours: number): string {
    if (ageHours < 2) return "bg-green-100 text-green-800";
    if (ageHours < 6) return "bg-yellow-100 text-yellow-800";
    if (ageHours < 24) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  }

  function formatAge(ageHours: number): string {
    if (ageHours < 1) {
      const mins = Math.round(ageHours * 60);
      return `${mins}m`;
    }
    if (ageHours < 24) {
      return `${Math.round(ageHours)}h`;
    }
    const days = Math.round(ageHours / 24);
    return `${days}d`;
  }

  return (
    <div className="space-y-2">
      {enriched.map((appt) => (
        <PendingQueueRow
          key={appt.id}
          appointment={appt}
          ageColor={getAgeColor(appt.ageHours)}
          ageBadgeColor={getAgeBadgeColor(appt.ageHours)}
          formattedAge={formatAge(appt.ageHours)}
        />
      ))}
    </div>
  );
}
