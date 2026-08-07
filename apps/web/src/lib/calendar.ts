/**
 * Pure calendar utilities — no DB or framework dependencies.
 */

import type { AppointmentStatus } from "@/generated/prisma/enums";
import { BLOCKING_STATUSES } from "@/lib/constants/booking";

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
  blockedTimes: ConflictBlockedTime[]
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
  hour: WorkingHour | undefined
): boolean {
  if (!hour || !hour.isOpen || !hour.openTime || !hour.closeTime) return true;

  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;

  return start >= timeToMinutes(hour.openTime) && end <= timeToMinutes(hour.closeTime);
}

export interface CardPosition {
  topPx: number;
  heightPx: number;
}

/** Absolute top/height (in px) for a card in an hour-based timeline grid. */
export function getCardPosition(
  startTime: string,
  durationMinutes: number,
  dayStartHour: number,
  hourHeightPx: number
): CardPosition {
  const startMinutes = timeToMinutes(startTime) - dayStartHour * 60;
  return {
    topPx: (startMinutes / 60) * hourHeightPx,
    heightPx: (durationMinutes / 60) * hourHeightPx,
  };
}

export interface LayoutInput {
  id: string;
  startTime: string;
  durationMinutes: number;
}

export interface LayoutResult {
  id: string;
  column: number;
  columnCount: number;
}

/**
 * Interval-graph-coloring layout for overlapping cards in a single column:
 * groups mutually-overlapping items into clusters and assigns each item a
 * `column` index (0-based) plus the cluster's `columnCount`, so callers can
 * render cards side-by-side at `width: 100% / columnCount`.
 */
export function layoutOverlappingCards(items: LayoutInput[]): LayoutResult[] {
  const sorted = [...items]
    .map((item) => {
      const start = timeToMinutes(item.startTime);
      return { ...item, start, end: start + item.durationMinutes };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const results: LayoutResult[] = [];
  let clusterItems: typeof sorted = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (clusterItems.length === 0) return;

    const columnEnds: number[] = [];
    const assigned: { id: string; column: number }[] = [];

    for (const item of clusterItems) {
      let column = columnEnds.findIndex((end) => end <= item.start);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(item.end);
      } else {
        columnEnds[column] = item.end;
      }
      assigned.push({ id: item.id, column });
    }

    const columnCount = columnEnds.length;
    for (const item of assigned) {
      results.push({ id: item.id, column: item.column, columnCount });
    }

    clusterItems = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    if (clusterItems.length > 0 && item.start >= clusterEnd) {
      flushCluster();
    }
    clusterItems.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flushCluster();

  return results;
}
