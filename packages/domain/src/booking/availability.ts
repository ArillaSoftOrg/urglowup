import { db } from "@urglowup/db";
import { generateTimeSlots, type TimeBlock } from "./slots";
import { BLOCKING_STATUSES, MAX_ADVANCE_DAYS, MIN_ADVANCE_HOURS, getDayOfWeek, nowInBusinessTimezone } from "./constants";

function parseTimeBlocks(value: unknown): TimeBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TimeBlock => {
    if (!item || typeof item !== "object") return false;
    const block = item as Record<string, unknown>;
    return typeof block.startTime === "string" && typeof block.endTime === "string";
  });
}

/** Backend-authoritative source of truth for which times can be booked. */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateString: string,
  durationOverrideMinutes?: number,
): Promise<string[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return [];

  const now = nowInBusinessTimezone();
  const requestedDate = new Date(dateString + "T00:00:00");

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateString < todayStr) return [];

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
  if (requestedDate > maxDate) return [];

  const appliedHoliday = await db.businessHolidaySuggestion.findFirst({
    where: {
      businessId,
      state: "APPLIED",
      holiday: { date: new Date(dateString) },
    },
  });
  if (appliedHoliday) return [];

  const dayOfWeek = getDayOfWeek(dateString);
  const [hour, service] = await Promise.all([
    db.businessHour.findUnique({
      where: { businessId_dayOfWeek: { businessId, dayOfWeek } },
    }),
    db.businessService.findFirst({
      where: { id: serviceId, businessId, isActive: true },
      select: { durationMinutes: true },
    }),
  ]);

  if (!hour || !hour.isOpen || !hour.openTime || !hour.closeTime) return [];
  if (!service) return [];

  const requestedDuration = durationOverrideMinutes ?? service.durationMinutes;
  if (!Number.isInteger(requestedDuration) || requestedDuration < 5 || requestedDuration > 24 * 60) {
    return [];
  }

  const existingAppointments = await db.appointment.findMany({
    where: {
      businessId,
      requestedDate: new Date(dateString),
      status: { in: BLOCKING_STATUSES },
    },
    select: {
      requestedTime: true,
      totalDurationMinutes: true,
      service: { select: { durationMinutes: true } },
    },
  });

  const occupied = existingAppointments.map((a) => ({
    requestedTime: a.requestedTime,
    durationMinutes: a.totalDurationMinutes ?? a.service.durationMinutes,
  }));

  let minTimeMinutes: number | undefined;
  if (dateString === todayStr) {
    minTimeMinutes = now.getHours() * 60 + now.getMinutes() + MIN_ADVANCE_HOURS * 60;
  }

  return generateTimeSlots(
    hour.openTime,
    hour.closeTime,
    hour.slotIntervalMinutes,
    requestedDuration,
    occupied,
    minTimeMinutes,
    {
      appointmentBufferMinutes: hour.appointmentBufferMinutes,
      workBlocks: parseTimeBlocks(hour.workBlocks),
      breakBlocks: parseTimeBlocks(hour.breakBlocks),
    },
  );
}
