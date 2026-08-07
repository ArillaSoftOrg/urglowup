import type { DayOfWeek } from "@urglowup/db";

// Duplicated from apps/web/src/lib/constants/booking.ts, which also defines
// UI-facing constants (status colors/labels) that pull in a component type —
// not something this package should depend on. Keep in sync by hand.

export const BUSINESS_TIMEZONE = "Europe/Istanbul";

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

export function nowInBusinessTimezone(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BUSINESS_TIMEZONE }));
}
