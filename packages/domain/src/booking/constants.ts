import type { AppointmentStatus, DayOfWeek } from "@urglowup/db";

// Duplicated from apps/web/src/lib/constants/booking.ts, which also holds
// UI-facing labels/colors this package shouldn't depend on. Keep in sync.

export const MIN_ADVANCE_HOURS = 2;
export const MAX_ADVANCE_DAYS = 60;
export const BUSINESS_TIMEZONE = "Europe/Istanbul";

/** Statuses that occupy a time slot (block other bookings). */
export const BLOCKING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

/** Statuses a customer can cancel/reschedule from. */
export const CUSTOMER_CANCELLABLE: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

export function nowInBusinessTimezone(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BUSINESS_TIMEZONE }));
}

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

/** Resolves the Prisma DayOfWeek for a "YYYY-MM-DD" date string. */
export function getDayOfWeek(dateString: string): DayOfWeek {
  const d = new Date(dateString + "T00:00:00");
  return DAY_MAP[d.getDay()];
}
