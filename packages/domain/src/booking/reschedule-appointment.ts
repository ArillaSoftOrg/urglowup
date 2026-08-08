import { db } from "@urglowup/db";
import { CUSTOMER_CANCELLABLE, BLOCKING_STATUSES, getDayOfWeek } from "./constants";
import {
  hasSchedulingConflict,
  isWithinWorkingHours,
  type ConflictAppointment,
  type ConflictBlockedTime,
} from "./calendar";

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
  const [businessHour, existingAppointments, blockedTimes] = await Promise.all([
    db.businessHour.findUnique({
      where: { businessId_dayOfWeek: { businessId: appointment.businessId, dayOfWeek } },
    }),
    db.appointment.findMany({
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
    db.blockedTime.findMany({
      where: { businessId: appointment.businessId, date: new Date(date) },
      select: { id: true, date: true, startTime: true, endTime: true, professionalId: true },
    }),
  ]);

  if (!businessHour || !businessHour.isOpen || !businessHour.openTime || !businessHour.closeTime) {
    return { ok: false, reason: "CLOSED" };
  }

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

  if (!isWithinWorkingHours(time, appointment.service.durationMinutes, businessHour)) {
    return { ok: false, reason: "OUTSIDE_WORKING_HOURS" };
  }

  const newNote = `Müşteri tarafından yeniden planlandı: ${appointment.requestedTime} -> ${time} (${new Date(appointment.requestedDate).toLocaleDateString("tr-TR")} -> ${new Date(date).toLocaleDateString("tr-TR")})`;
  const updatedNote = appointment.businessNote ? `${appointment.businessNote}\n${newNote}` : newNote;

  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      requestedDate: new Date(date),
      requestedTime: time,
      businessNote: updatedNote,
    },
  });

  return { ok: true };
}
