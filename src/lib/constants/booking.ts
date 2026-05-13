import type { AppointmentStatus } from "@/generated/prisma/enums";

export const MIN_ADVANCE_HOURS = 2;
export const MAX_ADVANCE_DAYS = 60;
export const BUSINESS_TIMEZONE = "Europe/Istanbul";

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
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
  CANCELLED_BY_CUSTOMER: "Cancelled",
  CANCELLED_BY_BUSINESS: "Cancelled by business",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
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

export function nowInBusinessTimezone(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: BUSINESS_TIMEZONE })
  );
}
