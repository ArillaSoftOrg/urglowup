import { db } from "@urglowup/db";
import { getAvailableSlots } from "./availability";
import { MAX_ADVANCE_DAYS, nowInBusinessTimezone } from "./constants";
import type { CreateAppointmentInput } from "./types";

export interface BookingItemRequest {
  guestName: string;
  guestIndex: number;
  serviceId: string;
  professionalId: string | null;
}

export interface PrepareBookingRequestInput {
  businessId: string;
  customerId: string;
  date: string;
  time: string;
  items: BookingItemRequest[];
  couponId: string | null;
  discountAmount: number | null;
  firstVisit: boolean | null;
  customerNote: string | null;
  idempotencyKey?: string;
}

export type PrepareBookingRequestResult =
  | { ok: true; input: CreateAppointmentInput }
  | {
      ok: false;
      reason:
        | "BUSINESS_NOT_BOOKABLE"
        | "GROUP_SIZE_EXCEEDED"
        | "SERVICE_UNAVAILABLE"
        | "PROFESSIONAL_UNAVAILABLE"
        | "NO_ITEMS"
        | "PAST_DATE"
        | "TOO_FAR_IN_ADVANCE"
        | "SLOT_TAKEN";
    };

/**
 * Validates and assembles a booking request into the input createAppointment()
 * (the concurrency-hardened, DB-writing half — see create-appointment.ts)
 * needs. Shared by the web Server Action and the /api/v1/appointments route
 * so both platforms apply identical business/service/professional/date/
 * availability rules — only form-data-vs-JSON parsing differs per caller.
 */
export async function prepareBookingRequest(
  request: PrepareBookingRequestInput,
): Promise<PrepareBookingRequestResult> {
  if (request.items.length === 0) {
    return { ok: false, reason: "NO_ITEMS" };
  }

  const business = await db.business.findUnique({
    where: { id: request.businessId },
    select: { status: true, maxGroupBookingGuests: true },
  });
  if (!business || business.status === "SUSPENDED" || business.status === "REJECTED") {
    return { ok: false, reason: "BUSINESS_NOT_BOOKABLE" };
  }

  const guestIndexes = new Set(request.items.map((item) => item.guestIndex));
  if (guestIndexes.size > business.maxGroupBookingGuests) {
    return { ok: false, reason: "GROUP_SIZE_EXCEEDED" };
  }

  const serviceIds = Array.from(new Set(request.items.map((item) => item.serviceId)));
  const services = await db.businessService.findMany({
    where: { id: { in: serviceIds }, businessId: request.businessId, isActive: true },
    select: { id: true, durationMinutes: true, price: true },
  });
  const servicesById = new Map(services.map((item) => [item.id, item]));
  if (services.length !== serviceIds.length) {
    return { ok: false, reason: "SERVICE_UNAVAILABLE" };
  }

  const professionalIds = Array.from(
    new Set(request.items.map((item) => item.professionalId).filter((id): id is string => Boolean(id))),
  );
  if (professionalIds.length > 0) {
    const professionalServices = await db.professionalService.findMany({
      where: {
        professionalId: { in: professionalIds },
        serviceId: { in: serviceIds },
        professional: { businessId: request.businessId, isActive: true },
      },
      select: { professionalId: true, serviceId: true },
    });
    const allowed = new Set(
      professionalServices.map((item) => `${item.professionalId}:${item.serviceId}`),
    );
    const invalidProfessional = request.items.some(
      (item) => item.professionalId && !allowed.has(`${item.professionalId}:${item.serviceId}`),
    );
    if (invalidProfessional) {
      return { ok: false, reason: "PROFESSIONAL_UNAVAILABLE" };
    }
  }

  const totalDurationMinutes = request.items.reduce(
    (sum, item) => sum + (servicesById.get(item.serviceId)?.durationMinutes ?? 0),
    0,
  );
  const totalPrice = request.items.reduce((sum, item) => {
    const price = servicesById.get(item.serviceId)?.price;
    return sum + (price ? Number(price) : 0);
  }, 0);
  const primaryItem = request.items[0];
  const primaryService = servicesById.get(primaryItem.serviceId);
  if (!primaryService || totalDurationMinutes <= 0) {
    return { ok: false, reason: "SERVICE_UNAVAILABLE" };
  }

  const now = nowInBusinessTimezone();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (request.date < todayStr) {
    return { ok: false, reason: "PAST_DATE" };
  }

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
  const requestedDate = new Date(request.date + "T00:00:00");
  if (requestedDate > maxDate) {
    return { ok: false, reason: "TOO_FAR_IN_ADVANCE" };
  }

  const availableSlots = await getAvailableSlots(
    request.businessId,
    primaryItem.serviceId,
    request.date,
    totalDurationMinutes,
  );
  if (!availableSlots.includes(request.time)) {
    return { ok: false, reason: "SLOT_TAKEN" };
  }

  return {
    ok: true,
    input: {
      businessId: request.businessId,
      customerId: request.customerId,
      primaryServiceId: primaryItem.serviceId,
      primaryProfessionalId: primaryItem.professionalId || null,
      couponId: request.couponId,
      discountAmount: request.discountAmount,
      requestedDate: request.date,
      requestedTime: request.time,
      isGroup: guestIndexes.size > 1,
      guestCount: guestIndexes.size,
      totalDurationMinutes,
      totalPrice: totalPrice || null,
      firstVisit: request.firstVisit,
      customerNote: request.customerNote,
      items: request.items.map((item) => {
        const itemService = servicesById.get(item.serviceId)!;
        return {
          guestName: item.guestName,
          guestIndex: item.guestIndex,
          serviceId: item.serviceId,
          professionalId: item.professionalId,
          durationMinutes: itemService.durationMinutes,
          priceSnapshot: itemService.price ? Number(itemService.price) : null,
        };
      }),
      idempotencyKey: request.idempotencyKey,
    },
  };
}
