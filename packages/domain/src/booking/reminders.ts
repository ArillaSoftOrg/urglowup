import { db } from "@urglowup/db";

/** Hours before an appointment's start time that the reminder fires. */
export const REMINDER_LEAD_HOURS = 2;

export interface AppointmentNeedingReminder {
  id: string;
  customerId: string;
  businessId: string;
  requestedDate: Date;
  requestedTime: string;
  business: { name: string };
  service: { name: string };
}

/**
 * Confirmed appointments starting between [now + REMINDER_LEAD_HOURS,
 * now + REMINDER_LEAD_HOURS + windowMinutes) that haven't been reminded yet.
 * `windowMinutes` should be >= the cron's run interval so no appointment
 * falls through the gap between two runs.
 *
 * Combines requestedDate (a bare DATE column) with requestedTime (a "HH:MM"
 * string) the same way cancel-appointment.ts/reschedule-appointment.ts do
 * for their advance-notice checks (`new Date(requestedDate).setHours(...)`)
 * — kept consistent with that existing pattern rather than introducing a
 * different time-combination approach here.
 */
export async function getAppointmentsNeedingReminders(
  windowMinutes: number,
): Promise<AppointmentNeedingReminder[]> {
  const now = Date.now();
  const windowStart = new Date(now + REMINDER_LEAD_HOURS * 60 * 60 * 1000);
  const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60 * 1000);

  // Narrow to the DB dates the window can possibly touch (today or
  // tomorrow, given a 2h lead) before filtering exact minute precision in
  // JS — requestedTime is a string, not filterable as a timestamp in SQL.
  const todayDateOnly = new Date(new Date().toISOString().slice(0, 10));
  const tomorrowDateOnly = new Date(todayDateOnly);
  tomorrowDateOnly.setDate(tomorrowDateOnly.getDate() + 1);

  const candidates = await db.appointment.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      requestedDate: { in: [todayDateOnly, tomorrowDateOnly] },
    },
    select: {
      id: true,
      customerId: true,
      businessId: true,
      requestedDate: true,
      requestedTime: true,
      business: { select: { name: true } },
      service: { select: { name: true } },
    },
  });

  return candidates.filter((appointment) => {
    const [h, m] = appointment.requestedTime.split(":").map(Number);
    const appointmentAt = new Date(appointment.requestedDate);
    appointmentAt.setHours(h, m, 0, 0);
    return appointmentAt >= windowStart && appointmentAt < windowEnd;
  });
}

/** Marks a reminder sent, guarded on reminderSentAt still being null (avoids double-send races across overlapping cron runs). */
export async function markReminderSent(appointmentId: string): Promise<boolean> {
  const result = await db.appointment.updateMany({
    where: { id: appointmentId, reminderSentAt: null },
    data: { reminderSentAt: new Date() },
  });
  return result.count > 0;
}
