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
 * Authentication (two accepted paths, checked in order):
 *   1. x-internal-secret header matching INTERNAL_API_SECRET env var (timingSafeEqual)
 *   2. Vercel Cron user-agent fallback: "vercel-cron/1.0"
 *
 * Cron schedule: every 15 minutes (star-slash-15 * * * * in vercel.json).
 * WINDOW_MINUTES below must stay >= the cron interval, or an appointment
 * whose reminder window falls entirely between two runs would never get one.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { INTERNAL_SECRET_HEADER } from "@/lib/constants/external";
import {
  getAppointmentsNeedingReminders,
  markReminderSent,
} from "@urglowup/domain/booking";
import { sendPushToUser } from "@urglowup/domain/notifications";

export const dynamic = "force-dynamic";

const WINDOW_MINUTES = 20;

function isAuthorised(request: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = request.headers.get(INTERNAL_SECRET_HEADER);

  if (provided !== null) {
    if (!secret) return false;
    try {
      const a = Buffer.from(secret, "utf8");
      const b = Buffer.from(provided, "utf8");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  const ua = request.headers.get("user-agent") ?? "";
  return ua.startsWith("vercel-cron/");
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
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
