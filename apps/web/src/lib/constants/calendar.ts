import type { AppointmentStatus } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

/** Synthetic status used for BlockedTime cards on the calendar */
export const BLOCKED_TIME_PSEUDO_STATUS = "BLOCKED_TIME" as const;

export type CalendarCardStatus = AppointmentStatus | typeof BLOCKED_TIME_PSEUDO_STATUS;

/** Tailwind classes for calendar appointment/blocked-time cards */
export const CALENDAR_STATUS_CARD_CLASSES: Record<CalendarCardStatus, string> = {
  PENDING: "bg-warning/60 border-warning text-warning-foreground",
  CONFIRMED: "bg-brand-pink/70 border-brand-pink text-brand-pink-foreground",
  CHECKED_IN: "bg-info/60 border-info text-info-foreground",
  COMPLETED: "bg-success/60 border-success text-success-foreground",
  REJECTED: "bg-destructive/10 border-destructive/30 text-destructive opacity-70",
  CANCELLED_BY_CUSTOMER: "bg-destructive/10 border-destructive/30 text-destructive opacity-70",
  CANCELLED_BY_BUSINESS: "bg-destructive/10 border-destructive/30 text-destructive opacity-70",
  NO_SHOW: "bg-destructive/10 border-destructive/30 text-destructive opacity-70",
  BLOCKED_TIME:
    "bg-neutral/50 border-neutral text-neutral-foreground [background-image:repeating-linear-gradient(45deg,var(--color-border)_0,var(--color-border)_1px,transparent_1px,transparent_8px)]",
};

/** Badge variants for the appointment detail panel */
export const CALENDAR_STATUS_BADGE_VARIANT: Record<CalendarCardStatus, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "pink",
  CHECKED_IN: "info",
  COMPLETED: "success",
  REJECTED: "neutral",
  CANCELLED_BY_CUSTOMER: "neutral",
  CANCELLED_BY_BUSINESS: "neutral",
  NO_SHOW: "secondary",
  BLOCKED_TIME: "neutral",
};

/** Default visible hour range for Day/Week/Staff timelines */
export const CALENDAR_DEFAULT_START_HOUR = 8;
export const CALENDAR_DEFAULT_END_HOUR = 20;

/** Pixel height of one hour row in timeline views */
export const CALENDAR_HOUR_HEIGHT_PX = 64;

/** Column id used when a business has no active Professional rows */
export const CALENDAR_GENERAL_COLUMN_ID = "__general__";

/** Default fetch window around "today" for calendar data */
export const CALENDAR_FETCH_MONTHS_BEFORE = 1;
export const CALENDAR_FETCH_MONTHS_AFTER = 2;
