/**
 * Pure slot generation, no DB or framework dependencies.
 */

import { timeToMinutes, minutesToTime } from "@/lib/calendar";

export interface ExistingAppointment {
  requestedTime: string;
  durationMinutes: number;
}

export interface TimeBlock {
  startTime: string;
  endTime: string;
}

export interface AdvancedSlotRules {
  workBlocks?: TimeBlock[];
  breakBlocks?: TimeBlock[];
  appointmentBufferMinutes?: number;
}

function normalizeBlocks(blocks: TimeBlock[] | undefined): TimeBlock[] {
  if (!blocks) return [];
  return blocks.filter((block) => {
    if (!block.startTime || !block.endTime) return false;
    return block.endTime > block.startTime;
  });
}

function overlaps(start: number, end: number, block: { start: number; end: number }) {
  return start < block.end && block.start < end;
}

/**
 * Generate available booking time slots for a given day.
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number,
  serviceDurationMinutes: number,
  existingAppointments: ExistingAppointment[],
  minTimeMinutes?: number,
  rules?: AdvancedSlotRules
): string[] {
  const openMin = timeToMinutes(openTime);
  const closeMin = timeToMinutes(closeTime);
  const slots: string[] = [];
  const buffer = rules?.appointmentBufferMinutes ?? 0;
  const workBlocks = normalizeBlocks(rules?.workBlocks);
  const effectiveWorkBlocks =
    workBlocks.length > 0 ? workBlocks : [{ startTime: openTime, endTime: closeTime }];
  const breakBlocks = normalizeBlocks(rules?.breakBlocks).map((block) => ({
    start: timeToMinutes(block.startTime),
    end: timeToMinutes(block.endTime),
  }));

  const occupied = existingAppointments.map((appointment) => {
    const start = timeToMinutes(appointment.requestedTime);
    return {
      start: start - buffer,
      end: start + appointment.durationMinutes + buffer,
    };
  });

  for (const block of effectiveWorkBlocks) {
    const blockStart = Math.max(openMin, timeToMinutes(block.startTime));
    const blockEnd = Math.min(closeMin, timeToMinutes(block.endTime));

    for (let t = blockStart; t + serviceDurationMinutes <= blockEnd; t += intervalMinutes) {
      if (minTimeMinutes !== undefined && t < minTimeMinutes) continue;

      const slotEnd = t + serviceDurationMinutes;
      if (breakBlocks.some((breakBlock) => overlaps(t, slotEnd, breakBlock))) continue;
      if (occupied.some((appointment) => overlaps(t, slotEnd, appointment))) continue;

      slots.push(minutesToTime(t));
    }
  }

  return Array.from(new Set(slots)).sort();
}
