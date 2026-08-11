import { db } from "@urglowup/db";
import { CUSTOMER_CANCELLABLE, BLOCKING_STATUSES, getDayOfWeek } from "./constants";
import {
  hasSchedulingConflict,
  isWithinWorkingHours,
  type ConflictAppointment,
  type ConflictBlockedTime,
} from "./calendar";
import { isSlotConflictError, runInSlotLock, slotLockKey } from "./slot-lock";

export type RescheduleAppointmentResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "NOT_FOUND"
        | "NOT_RESCHEDULABLE"
        | "PAST_DATE"
        | "CLOSED"
        | "CONFLICT"
        | "OUTSIDE_WORKING_HOURS";
    };

export async function rescheduleAppointment(
  userId: string,
  appointmentId: string,
  date: string,
  time: string,
): Promise<RescheduleAppointmentResult> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      customerId: true,
      status: true,
      businessId: true,
      serviceId: true,
      professionalId: true,
      requestedDate: true,
      requestedTime: true,
      businessNote: true,
      service: { select: { durationMinutes: true } },
    },
  });

  if (!appointment || appointment.customerId !== userId) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (!CUSTOMER_CANCELLABLE.includes(appointment.status)) {
    return { ok: false, reason: "NOT_RESCHEDULABLE" };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (date < todayStr) {
    return { ok: false, reason: "PAST_DATE" };
  }

  const dayOfWeek = getDayOfWeek(date);
  const businessHour = await db.businessHour.findUnique({
    where: { businessId_dayOfWeek: { businessId: appointment.businessId, dayOfWeek } },
  });

  if (!businessHour || !businessHour.isOpen || !businessHour.openTime || !businessHour.closeTime) {
    return { ok: false, reason: "CLOSED" };
  }

  if (!isWithinWorkingHours(time, appointment.service.durationMinutes, businessHour)) {
    return { ok: false, reason: "OUTSIDE_WORKING_HOURS" };
  }

  const newNote = `Müşteri tarafından yeniden planlandı: ${appointment.requestedTime} -> ${time} (${new Date(appointment.requestedDate).toLocaleDateString("tr-TR")} -> ${new Date(date).toLocaleDateString("tr-TR")})`;
  const updatedNote = appointment.businessNote ? `${appointment.businessNote}\n${newNote}` : newNote;

  const lockKey = slotLockKey(appointment.businessId, appointment.professionalId, date, time);

  return runInSlotLock(lockKey, async (tx) => {
    // Re-check conflicts with fresh data now that we hold the slot lock —
    // the pre-lock businessHour/working-hours checks above are safe to do
    // early (they don't depend on other appointments), but conflicts do.
    const [existingAppointments, blockedTimes] = await Promise.all([
      tx.appointment.findMany({
        where: {
          businessId: appointment.businessId,
          requestedDate: new Date(date),
          status: { in: BLOCKING_STATUSES },
          id: { not: appointmentId },
        },
        select: {
          id: true,
          requestedDate: true,
          requestedTime: true,
          service: { select: { durationMinutes: true } },
          professionalId: true,
          status: true,
        },
      }),
      tx.blockedTime.findMany({
        where: { businessId: appointment.businessId, date: new Date(date) },
        select: { id: true, date: true, startTime: true, endTime: true, professionalId: true },
      }),
    ]);

    const conflictAppointments: ConflictAppointment[] = existingAppointments.map((a) => ({
      id: a.id,
      requestedDate: a.requestedDate,
      requestedTime: a.requestedTime,
      durationMinutes: a.service.durationMinutes,
      professionalId: a.professionalId,
      status: a.status,
    }));

    const conflictBlockedTimes: ConflictBlockedTime[] = blockedTimes.map((b) => ({
      id: b.id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      professionalId: b.professionalId,
    }));

    if (
      hasSchedulingConflict(
        {
          date,
          startTime: time,
          durationMinutes: appointment.service.durationMinutes,
          professionalId: appointment.professionalId,
        },
        conflictAppointments,
        conflictBlockedTimes,
      )
    ) {
      return { ok: false, reason: "CONFLICT" };
    }

    try {
      // Guarded on status still being cancellable — closes the window
      // between the pre-lock status check above and acquiring the lock
      // (e.g. the business rejected/cancelled it concurrently).
      const updated = await tx.appointment.updateMany({
        where: { id: appointmentId, status: { in: CUSTOMER_CANCELLABLE } },
        data: {
          requestedDate: new Date(date),
          requestedTime: time,
          businessNote: updatedNote,
        },
      });

      if (updated.count === 0) {
        return { ok: false, reason: "NOT_RESCHEDULABLE" };
      }

      return { ok: true };
    } catch (err) {
      // Defense-in-depth: the advisory lock + fresh re-check above should
      // make this unreachable in normal operation, but the partial unique
      // index is the hard backstop if it's ever bypassed.
      if (isSlotConflictError(err)) {
        return { ok: false, reason: "CONFLICT" };
      }
      throw err;
    }
  });
}
