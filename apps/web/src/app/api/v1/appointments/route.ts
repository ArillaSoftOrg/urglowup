import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/auth";
import { apiPage, apiOk, apiError } from "@/lib/api/response";
import { parseCursorParams } from "@/lib/api/pagination";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isSuspended } from "@/lib/admin/user-suspension";
import { createAppointmentBodySchema } from "@urglowup/validation";
import { createAppointment, listCustomerAppointments, prepareBookingRequest } from "@urglowup/domain/booking";
import { headers } from "next/headers";
import {
  sendNewRequestEmailToBusiness,
  sendRequestReceivedEmailToCustomer,
} from "@/lib/email-notifications";
import { notifyBusinessAppointmentRequested } from "@/lib/in-app-notifications";
import { sendBookingConfirmationWhatsApp } from "@/lib/whatsapp-notifications";
import { sendPushToUser } from "@urglowup/domain/notifications";

const PREPARE_FAILURE_MESSAGES: Record<
  Exclude<Awaited<ReturnType<typeof prepareBookingRequest>>, { ok: true }>["reason"],
  string
> = {
  BUSINESS_NOT_BOOKABLE: "This business is not currently accepting bookings.",
  GROUP_SIZE_EXCEEDED: "This business doesn't accept a group of that size.",
  SERVICE_UNAVAILABLE: "One of the selected services is no longer available.",
  PROFESSIONAL_UNAVAILABLE: "One of the selected professionals doesn't offer that service.",
  NO_ITEMS: "At least one service selection is required.",
  PAST_DATE: "You can't book a date in the past.",
  TOO_FAR_IN_ADVANCE: "That date is too far in advance.",
  SLOT_TAKEN: "That time is no longer available. Please pick another.",
};

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { cursor, limit } = parseCursorParams(request.nextUrl.searchParams);
  const page = await listCustomerAppointments(auth.user.id, { cursor, limit });

  return apiPage(page);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  if (isSuspended(auth.user)) {
    return apiError("FORBIDDEN", "Your account is suspended.");
  }

  const rateLimit = await enforceRateLimit({
    scope: "booking",
    headers: await headers(),
    subjectId: auth.user.id,
    ipLimit: 40,
    subjectLimit: 20,
  });
  if (!rateLimit.ok) {
    return apiError("RATE_LIMITED", rateLimit.message);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be JSON.");
  }

  const parsed = createAppointmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid booking request.");
  }

  const data = parsed.data;
  const items = data.items ?? [
    { guestName: "Me", guestIndex: 0, serviceId: data.serviceId, professionalId: data.professionalId ?? null },
  ];

  const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;

  const prepared = await prepareBookingRequest({
    businessId: data.businessId,
    customerId: auth.user.id,
    date: data.date,
    time: data.time,
    items: items.map((item) => ({
      guestName: item.guestName,
      guestIndex: item.guestIndex,
      serviceId: item.serviceId,
      professionalId: item.professionalId ?? null,
    })),
    couponId: data.couponId ?? null,
    discountAmount: data.discountAmount ?? null,
    firstVisit: data.firstVisit ?? null,
    customerNote: data.customerNote ?? null,
    idempotencyKey,
  });

  if (!prepared.ok) {
    const isConflict = prepared.reason === "SLOT_TAKEN";
    return apiError(isConflict ? "CONFLICT" : "VALIDATION_ERROR", PREPARE_FAILURE_MESSAGES[prepared.reason]);
  }

  const creation = await createAppointment(prepared.input);
  if (!creation.ok) {
    const messages: Record<typeof creation.reason, string> = {
      SLOT_TAKEN: "That time is no longer available. Please pick another.",
      DUPLICATE_CUSTOMER_BOOKING: "You already have a booking at that time.",
      COUPON_EXHAUSTED: "That coupon can no longer be used.",
    };
    return apiError("CONFLICT", messages[creation.reason]);
  }

  // Same notification set as the web booking flow, just awaited inline
  // instead of via Next's `after()` (that API is Server-Action/page-render
  // specific — route handlers don't get it). A proper background job queue
  // is Phase 6 (unified notification service) scope; each send is
  // independently try/caught so one failure can't fail the booking or
  // block the others.
  await Promise.allSettled([
    sendNewRequestEmailToBusiness(creation.appointmentId).catch((err) =>
      console.error("[email] POST /api/v1/appointments → business:", err),
    ),
    sendRequestReceivedEmailToCustomer(creation.appointmentId).catch((err) =>
      console.error("[email] POST /api/v1/appointments → customer:", err),
    ),
    sendBookingConfirmationWhatsApp(creation.appointmentId).catch((err) =>
      console.error("[whatsapp] POST /api/v1/appointments:", err),
    ),
    notifyBusinessAppointmentRequested(creation.appointmentId).catch((err) =>
      console.error("[in-app] POST /api/v1/appointments:", err),
    ),
    sendPushToUser(auth.user.id, {
      title: "Randevu talebiniz alındı",
      body: "İşletme onayladığında bilgilendirileceksiniz.",
      data: { appointmentId: creation.appointmentId, type: "APPOINTMENT_REQUESTED" },
    }).catch((err) => console.error("[push] POST /api/v1/appointments:", err)),
  ]);

  return apiOk({ appointmentId: creation.appointmentId }, 201);
}
