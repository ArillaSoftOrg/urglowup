/**
 * Pure slot generation — no DB or framework dependencies.
 */

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface ExistingAppointment {
  requestedTime: string; // "HH:MM"
  durationMinutes: number;
}

/**
 * Generate available booking time slots for a given day.
 *
 * @param openTime          Business open time, e.g. "09:00"
 * @param closeTime         Business close time, e.g. "18:00"
 * @param intervalMinutes   Slot interval (e.g. 30)
 * @param serviceDurationMinutes  Duration of the selected service
 * @param existingAppointments    Already-booked appointments (PENDING/CONFIRMED)
 * @param minTimeMinutes    Earliest allowed slot in minutes-from-midnight (for today's advance check)
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number,
  serviceDurationMinutes: number,
  existingAppointments: ExistingAppointment[],
  minTimeMinutes?: number
): string[] {
  const openMin = timeToMinutes(openTime);
  const closeMin = timeToMinutes(closeTime);
  const slots: string[] = [];

  // Pre-compute existing appointment intervals
  const occupied = existingAppointments.map((a) => {
    const start = timeToMinutes(a.requestedTime);
    return { start, end: start + a.durationMinutes };
  });

  for (let t = openMin; t + serviceDurationMinutes <= closeMin; t += intervalMinutes) {
    // Today advance check
    if (minTimeMinutes !== undefined && t < minTimeMinutes) continue;

    // Conflict check — does [t, t+duration) overlap any occupied interval?
    const slotEnd = t + serviceDurationMinutes;
    const hasConflict = occupied.some(
      (o) => t < o.end && o.start < slotEnd
    );
    if (hasConflict) continue;

    slots.push(minutesToTime(t));
  }

  return slots;
}
