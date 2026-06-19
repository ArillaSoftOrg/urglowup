import { getAdminPendingQueue } from "@/lib/queries/admin";
import { PendingQueueRow } from "./pending-queue-row";

export async function PendingQueue() {
  const appointments = await getAdminPendingQueue();

  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted p-8 text-center">
        <p className="text-muted-foreground">No pending appointments.</p>
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
    if (ageHours < 2) return "bg-success/10 border-success/20";
    if (ageHours < 6) return "bg-warning/10 border-warning/20";
    if (ageHours < 24) return "bg-warning/20 border-warning/30";
    return "bg-destructive/10 border-destructive/20";
  }

  function getAgeBadgeColor(ageHours: number): string {
    if (ageHours < 2) return "bg-success text-success-foreground";
    if (ageHours < 6) return "bg-warning text-warning-foreground";
    if (ageHours < 24) return "bg-warning text-warning-foreground";
    return "bg-destructive/10 text-destructive";
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
