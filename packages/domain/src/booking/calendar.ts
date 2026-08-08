/**
 * Pure calendar utilities — no DB or framework dependencies. Duplicated
 * (scheduling-conflict + time-math subset only) from apps/web/src/lib/calendar.ts,
 * which also has UI grid-layout helpers (getCardPosition, layoutOverlappingCards)
 * this package has no use for.
 */
import type { AppointmentStatus } from "@urglowup/db";
import { BLOCKING_STATUSES } from "./constants";

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Normalizes a Date or "YYYY-MM-DD" string to a "YYYY-MM-DD" key for same-day comparisons. */
export function toDateKey(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export interface ConflictCheckInput {
  date: Date | string;
  startTime: string;
  durationMinutes: number;
  professionalId: string | null;
  excludeAppointmentId?: string;
}

export interface ConflictAppointment {
  id: string;
  requestedDate: Date | string;
  requestedTime: string;
  durationMinutes: number;
  professionalId: string | null;
  status: AppointmentStatus;
}

export interface ConflictBlockedTime {
  id: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  professionalId: string | null;
}

/**
 * Checks whether the given slot overlaps an existing blocking appointment
 * (same professional column) or a BlockedTime entry (business-wide blocks
 * with `professionalId: null` apply to every column).
 */
export function hasSchedulingConflict(
  input: ConflictCheckInput,
  existingAppointments: ConflictAppointment[],
  blockedTimes: ConflictBlockedTime[],
): boolean {
  const dateKey = toDateKey(input.date);
  const start = timeToMinutes(input.startTime);
  const end = start + input.durationMinutes;

  const appointmentConflict = existingAppointments.some((appt) => {
    if (appt.id === input.excludeAppointmentId) return false;
    if (!BLOCKING_STATUSES.includes(appt.status)) return false;
    if (toDateKey(appt.requestedDate) !== dateKey) return false;
    if (appt.professionalId !== input.professionalId) return false;

    const apptStart = timeToMinutes(appt.requestedTime);
    const apptEnd = apptStart + appt.durationMinutes;
    return start < apptEnd && apptStart < end;
  });

  if (appointmentConflict) return true;

  return blockedTimes.some((blocked) => {
    if (toDateKey(blocked.date) !== dateKey) return false;
    if (blocked.professionalId !== null && blocked.professionalId !== input.professionalId) {
      return false;
    }

    const blockedStart = timeToMinutes(blocked.startTime);
    const blockedEnd = timeToMinutes(blocked.endTime);
    return start < blockedEnd && blockedStart < end;
  });
}

export interface WorkingHour {
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
}

/**
 * Soft guard: returns true if the slot fits within the business's configured
 * working hours for that day. If the day is closed or hours are unconfigured,
 * returns true (staff can always manually schedule).
 */
export function isWithinWorkingHours(
  startTime: string,
  durationMinutes: number,
  hour: WorkingHour | undefined,
): boolean {
  if (!hour || !hour.isOpen || !hour.openTime || !hour.closeTime) return true;

  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;

  return start >= timeToMinutes(hour.openTime) && end <= timeToMinutes(hour.closeTime);
}
