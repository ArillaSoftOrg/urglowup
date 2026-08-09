import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { rescheduleAppointmentBodySchema } from "@urglowup/validation";
import { rescheduleAppointment } from "@urglowup/domain/booking";
import {
  sendRescheduleRequestEmailToBusiness,
  sendConfirmedEmailToCustomer,
} from "@/lib/email-notifications";
import { notifyBusinessAppointmentRescheduledByCustomer } from "@/lib/in-app-notifications";

interface Params {
  params: Promise<{ id: string }>;
}

const RESCHEDULE_FAILURE_MESSAGES = {
  NOT_FOUND: "Appointment not found.",
  NOT_RESCHEDULABLE: "This appointment can't be rescheduled.",
  PAST_DATE: "You can't reschedule to a date in the past.",
  CLOSED: "The business is closed that day.",
  CONFLICT: "That time conflicts with another appointment. Please pick another.",
  OUTSIDE_WORKING_HOURS: "That time is outside working hours. Please pick another.",
} as const;

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "booking",
    subjectId: auth.user.id,
    ipLimit: 40,
    subjectLimit: 20,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be JSON.");
  }

  const parsed = rescheduleAppointmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid date or time.");
  }

  const { id: appointmentId } = await params;
  const result = await rescheduleAppointment(auth.user.id, appointmentId, parsed.data.date, parsed.data.time);

  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? "NOT_FOUND" : "CONFLICT";
    return apiError(status, RESCHEDULE_FAILURE_MESSAGES[result.reason]);
  }

  await Promise.allSettled([
    sendRescheduleRequestEmailToBusiness(appointmentId, parsed.data.date, parsed.data.time).catch((err) =>
      console.error("[email] reschedule → business:", err),
    ),
    sendConfirmedEmailToCustomer(appointmentId).catch((err) =>
      console.error("[email] reschedule → customer:", err),
    ),
    notifyBusinessAppointmentRescheduledByCustomer(appointmentId).catch((err) =>
      console.error("[in-app] reschedule:", err),
    ),
  ]);

  return apiOk({ appointmentId });
}
