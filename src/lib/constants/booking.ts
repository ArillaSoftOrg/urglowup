import type { AppointmentStatus, DayOfWeek } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

export const MIN_ADVANCE_HOURS = 2;
export const MAX_ADVANCE_DAYS = 60;
export const BUSINESS_TIMEZONE = "Europe/Istanbul";

/** JS Date.getDay() (0=Sunday) → Prisma DayOfWeek */
export const DAY_MAP: Record<number, DayOfWeek> = {
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

/** Statuses that occupy a time slot (block other bookings) */
export const BLOCKING_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
];

/** Statuses considered "upcoming" for display purposes */
export const UPCOMING_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
];

/** Terminal statuses (no further transitions allowed) */
export const TERMINAL_STATUSES: AppointmentStatus[] = [
  "REJECTED",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_BUSINESS",
  "COMPLETED",
  "NO_SHOW",
];

/** Statuses a customer can cancel from */
export const CUSTOMER_CANCELLABLE: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
];

/** Valid status transitions */
export const STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED_BY_CUSTOMER"],
  CONFIRMED: [
    "COMPLETED",
    "NO_SHOW",
    "CANCELLED_BY_CUSTOMER",
    "CANCELLED_BY_BUSINESS",
  ],
  REJECTED: [],
  CANCELLED_BY_CUSTOMER: [],
  CANCELLED_BY_BUSINESS: [],
  COMPLETED: [],
  NO_SHOW: [],
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  REJECTED: "Reddedildi",
  CANCELLED_BY_CUSTOMER: "Müşteri iptal etti",
  CANCELLED_BY_BUSINESS: "İşletme iptal etti",
  COMPLETED: "Tamamlandı",
  NO_SHOW: "Gelmedi",
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED_BY_CUSTOMER: "bg-gray-100 text-gray-800",
  CANCELLED_BY_BUSINESS: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
};

export const STATUS_VARIANTS: Record<AppointmentStatus, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "success",
  REJECTED: "destructive",
  CANCELLED_BY_CUSTOMER: "neutral",
  CANCELLED_BY_BUSINESS: "neutral",
  COMPLETED: "info",
  NO_SHOW: "secondary",
};

export function nowInBusinessTimezone(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: BUSINESS_TIMEZONE })
  );
}
