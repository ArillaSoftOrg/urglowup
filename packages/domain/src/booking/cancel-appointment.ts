import { db } from "@urglowup/db";
import { CUSTOMER_CANCELLABLE, MIN_ADVANCE_HOURS } from "./constants";

export type CancelAppointmentResult =
  | {
      ok: true;
      appointment: {
        id: string;
        businessId: string;
        serviceId: string;
        requestedDate: Date;
        requestedTime: string;
      };
    }
  | { ok: false; reason: "NOT_FOUND" | "NOT_CANCELLABLE" | "TOO_CLOSE_TO_START" };

export async function cancelAppointment(
  userId: string,
  appointmentId: string,
  reason?: string,
): Promise<CancelAppointmentResult> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      customerId: true,
      status: true,
      requestedDate: true,
      requestedTime: true,
      businessId: true,
      serviceId: true,
    },
  });

  if (!appointment || appointment.customerId !== userId) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (!CUSTOMER_CANCELLABLE.includes(appointment.status)) {
    return { ok: false, reason: "NOT_CANCELLABLE" };
  }

  if (appointment.status === "CONFIRMED") {
    const [h, m] = appointment.requestedTime.split(":").map(Number);
    const appointmentAt = new Date(appointment.requestedDate);
    appointmentAt.setHours(h, m, 0, 0);
    const cutoff = new Date(Date.now() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
    if (appointmentAt < cutoff) {
      return { ok: false, reason: "TOO_CLOSE_TO_START" };
    }
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED_BY_CUSTOMER",
      cancelledReason: reason?.trim() || null,
    },
  });

  return {
    ok: true,
    appointment: {
      id: appointmentId,
      businessId: appointment.businessId,
      serviceId: appointment.serviceId,
      requestedDate: appointment.requestedDate,
      requestedTime: appointment.requestedTime,
    },
  };
}
