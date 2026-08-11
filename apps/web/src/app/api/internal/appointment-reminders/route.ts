/**
 * Internal appointment-reminder endpoint.
 *
 * Sends a push notification ~2 hours before each CONFIRMED appointment's
 * start time (packages/domain/src/booking/reminders.ts's REMINDER_LEAD_HOURS).
 * Push only for now — email/WhatsApp reminder templates aren't built yet,
 * flagged as still-deferred rather than attempted half-finished.
 *
 * Route:   GET /api/internal/appointment-reminders
 * Access:  Internal only — NOT publicly callable
 *
 * Authentication: x-internal-secret header matching INTERNAL_API_SECRET
 * env var (timing-safe comparison), enforced by lib/internal-auth.ts.
 * No User-Agent fallback — see that file's doc comment for why.
 *
 * Cron schedule: every 15 minutes (star-slash-15 * * * * in vercel.json).
 * WINDOW_MINUTES below must stay >= the cron interval, or an appointment
 * whose reminder window falls entirely between two runs would never get one.
 */
import { NextResponse } from "next/server";
import {
  getAppointmentsNeedingReminders,
  markReminderSent,
} from "@urglowup/domain/booking";
import { sendPushToUser } from "@urglowup/domain/notifications";
import { isInternalRequestAuthorized, unauthorizedInternalResponse } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

const WINDOW_MINUTES = 20;

export async function GET(request: Request) {
  if (!isInternalRequestAuthorized(request)) {
    return unauthorizedInternalResponse();
  }

  const appointments = await getAppointmentsNeedingReminders(WINDOW_MINUTES);
  let sent = 0;

  for (const appointment of appointments) {
    // Claim first, send second — an appointment reminder is "at most once,"
    // not "at least once": if the push send itself fails after the claim,
    // that's an acceptable tradeoff against double-sending across
    // overlapping cron runs.
    const claimed = await markReminderSent(appointment.id);
    if (!claimed) continue;

    try {
      await sendPushToUser(appointment.customerId, {
        title: "Randevu hatırlatma",
        body: `${appointment.business.name} — ${appointment.service.name} randevun ${appointment.requestedTime} saatinde.`,
        data: { appointmentId: appointment.id, type: "APPOINTMENT_REMINDER" },
      });
      sent += 1;
    } catch (err) {
      console.error("[appointment-reminders] send failed:", appointment.id, err);
    }
  }

  return NextResponse.json({
    candidates: appointments.length,
    sent,
    timestamp: new Date().toISOString(),
  });
}
