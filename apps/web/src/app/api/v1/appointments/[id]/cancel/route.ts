import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { cancelAppointmentBodySchema } from "@urglowup/validation";
import { cancelAppointment } from "@urglowup/domain/booking";
import {
  sendCancelledByCustomerEmailToBusiness,
  sendCancellationConfirmationEmailToCustomer,
} from "@/lib/email-notifications";
import { notifyBusinessAppointmentCancelledByCustomer } from "@/lib/in-app-notifications";
import { notifyWaitlist } from "@/app/(public)/b/[slug]/book/waitlist-actions";

interface Params {
  params: Promise<{ id: string }>;
}

const CANCEL_FAILURE_MESSAGES = {
  NOT_FOUND: "Appointment not found.",
  NOT_CANCELLABLE: "This appointment can no longer be cancelled.",
  TOO_CLOSE_TO_START: "Confirmed appointments can only be cancelled up to 2 hours in advance.",
} as const;

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  let reason: string | undefined;
  const body = await request.json().catch(() => null);
  if (body !== null) {
    const parsed = cancelAppointmentBodySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid cancel request.");
    }
    reason = parsed.data.reason;
  }

  const { id: appointmentId } = await params;
  const cancellation = await cancelAppointment(auth.user.id, appointmentId, reason);

  if (!cancellation.ok) {
    const status = cancellation.reason === "NOT_FOUND" ? "NOT_FOUND" : "CONFLICT";
    return apiError(status, CANCEL_FAILURE_MESSAGES[cancellation.reason]);
  }

  const { appointment } = cancellation;

  await Promise.allSettled([
    sendCancelledByCustomerEmailToBusiness(appointmentId).catch((err) =>
      console.error("[email] cancel → business:", err),
    ),
    sendCancellationConfirmationEmailToCustomer(appointmentId).catch((err) =>
      console.error("[email] cancel → customer:", err),
    ),
    notifyWaitlist(
      appointment.businessId,
      appointment.serviceId,
      appointment.requestedDate.toISOString().slice(0, 10),
      appointment.requestedTime,
    ).catch((err) => console.error("[waitlist] cancel:", err)),
    notifyBusinessAppointmentCancelledByCustomer(appointmentId).catch((err) =>
      console.error("[in-app] cancel:", err),
    ),
  ]);

  return apiOk({ appointmentId });
}
