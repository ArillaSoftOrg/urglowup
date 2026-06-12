import type {
  CalendarAppointment,
  CalendarBlockedTime,
  CalendarProfessional,
  CalendarService,
  CalendarCustomerSummary,
  CalendarBusinessHour,
} from "@/lib/queries/appointments";

export type {
  CalendarAppointment,
  CalendarBlockedTime,
  CalendarProfessional,
  CalendarService,
  CalendarCustomerSummary,
  CalendarBusinessHour,
};

export type CalendarView = "day" | "week" | "month" | "staff" | "list";

/** Client-safe service shape (Decimal price converted to number). */
export interface SerializedCalendarService extends Omit<CalendarService, "price"> {
  price: number | null;
}

/** Client-safe appointment shape (Decimal service price converted to number). */
export interface SerializedCalendarAppointment extends Omit<CalendarAppointment, "service"> {
  service: Omit<CalendarAppointment["service"], "price"> & { price: number | null };
}

export type CalendarSelection =
  | { kind: "appointment"; appointment: SerializedCalendarAppointment }
  | { kind: "blocked"; blockedTime: CalendarBlockedTime }
  | null;

/** Prefill passed to AppointmentForm when opened from an empty slot click. */
export interface CalendarFormPrefill {
  date: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:MM"
  professionalId?: string | null;
}

function serializePrice(price: CalendarService["price"]): number | null {
  return price !== null ? Number(price) : null;
}

export function serializeCalendarService(
  service: CalendarService,
): SerializedCalendarService {
  return { ...service, price: serializePrice(service.price) };
}

export function serializeCalendarAppointment(
  appointment: CalendarAppointment,
): SerializedCalendarAppointment {
  return {
    ...appointment,
    service: { ...appointment.service, price: serializePrice(appointment.service.price) },
  };
}

export function getAppointmentCustomerName(
  appointment: Pick<CalendarAppointment, "customer">,
): string {
  const name = [appointment.customer.firstName, appointment.customer.lastName]
    .filter(Boolean)
    .join(" ");
  return name || appointment.customer.email;
}

export function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

/** Formats a service's price for display, e.g. "₺250" or "Başlangıç ₺250". */
export function formatServicePrice(service: {
  price: number | null;
  priceType: string;
}): string | null {
  if (service.priceType === "FREE_CONSULTATION") return "Ücretsiz danışma";
  if (service.priceType === "CONSULTATION_REQUIRED") return "Danışma ücreti";
  if (service.price == null) return null;
  const amount = `₺${service.price}`;
  if (service.priceType === "STARTS_FROM") return `Başlangıç ${amount}`;
  return amount;
}
