"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { CUSTOMER_CANCELLABLE, getDayOfWeek, BLOCKING_STATUSES } from "@/lib/constants/booking";
import {
  sendCancelledByCustomerEmailToBusiness,
  sendCancellationConfirmationEmailToCustomer,
  sendRescheduleRequestEmailToBusiness,
  sendConfirmedEmailToCustomer,
} from "@/lib/email-notifications";
import { notifyBusinessAppointmentCancelledByCustomer } from "@/lib/in-app-notifications";
import { hasSchedulingConflict, isWithinWorkingHours, type ConflictAppointment, type ConflictBlockedTime } from "@/lib/calendar";

export type AppointmentActionState = {
  success: boolean;
  message?: string;
};

export async function cancelAppointment(
  appointmentId: string
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated." };
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { customerId: true, status: true },
  });

  if (!appointment || appointment.customerId !== user.id) {
    return { success: false, message: "Appointment not found." };
  }

  if (!CUSTOMER_CANCELLABLE.includes(appointment.status)) {
    return {
      success: false,
      message: "This appointment can no longer be cancelled.",
    };
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED_BY_CUSTOMER" },
  });

  after(async () => {
    try {
      await sendCancelledByCustomerEmailToBusiness(appointmentId);
    } catch (err) {
      console.error("[email] cancelAppointment → business:", err);
    }
  });

  after(async () => {
    try {
      await sendCancellationConfirmationEmailToCustomer(appointmentId);
    } catch (err) {
      console.error("[email] cancelAppointment → customer:", err);
    }
  });

  after(async () => {
    try {
      await notifyBusinessAppointmentCancelledByCustomer(appointmentId);
    } catch (err) {
      console.error("[in-app] cancelAppointment -> business:", err);
    }
  });

  revalidatePath("/account/appointments");
  revalidatePath("/business/appointments");
  revalidatePath("/business/dashboard");

  return { success: true, message: "Appointment cancelled." };
}

const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
});

export async function rescheduleAppointment(
  input: z.input<typeof rescheduleSchema>
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Randevuyu yeniden planlamak için giriş yapmalısınız." };
  }

  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Geçersiz tarih veya saat." };
  }
  const { appointmentId, date, time } = parsed.data;

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

  if (!appointment || appointment.customerId !== user.id) {
    return { success: false, message: "Randevu bulunamadı." };
  }

  if (!CUSTOMER_CANCELLABLE.includes(appointment.status)) {
    return { success: false, message: "Bu randevu yeniden planlanamaz." };
  }

  // Check date is not in the past
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (date < todayStr) {
    return { success: false, message: "Geçmiş bir tarih seçemezsiniz." };
  }

  // Get business hours for the new date
  const dayOfWeek = getDayOfWeek(date);
  const [businessHour, existingAppointments, blockedTimes] = await Promise.all([
    db.businessHour.findUnique({
      where: {
        businessId_dayOfWeek: { businessId: appointment.businessId, dayOfWeek },
      },
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
      where: {
        businessId: appointment.businessId,
        date: new Date(date),
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        professionalId: true,
      },
    }),
  ]);

  if (!businessHour || !businessHour.isOpen || !businessHour.openTime || !businessHour.closeTime) {
    return { success: false, message: "Bu gün için randevu alınamıyor." };
  }

  // Convert to conflict check format
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

  // Check for conflicts
  if (
    hasSchedulingConflict(
      {
        date,
        startTime: time,
        durationMinutes: appointment.service.durationMinutes,
        professionalId: appointment.professionalId,
      },
      conflictAppointments,
      conflictBlockedTimes
    )
  ) {
    return { success: false, message: "Bu saatte çakışan bir randevu var. Başka bir saat seçin." };
  }

  // Check working hours (hard block for customer reschedule)
  if (!isWithinWorkingHours(time, appointment.service.durationMinutes, businessHour)) {
    return { success: false, message: "Bu saat çalışma saatleri dışında. Lütfen başka bir saat seçin." };
  }

  // Append audit note to businessNote
  const newNote = `Müşteri tarafından yeniden planlandı: ${appointment.requestedTime} -> ${time} (${new Date(appointment.requestedDate).toLocaleDateString("tr-TR")} -> ${new Date(date).toLocaleDateString("tr-TR")})`;
  const updatedNote = appointment.businessNote ? `${appointment.businessNote}\n${newNote}` : newNote;

  // Update appointment
  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      requestedDate: new Date(date),
      requestedTime: time,
      businessNote: updatedNote,
    },
  });

  // Send email to business
  after(async () => {
    try {
      await sendRescheduleRequestEmailToBusiness(appointmentId, date, time);
    } catch (err) {
      console.error("[email] rescheduleAppointment → business:", err);
    }
  });

  // Send confirmation email to customer
  after(async () => {
    try {
      await sendConfirmedEmailToCustomer(appointmentId);
    } catch (err) {
      console.error("[email] rescheduleAppointment → customer:", err);
    }
  });

  revalidatePath("/account/appointments");
  revalidatePath("/business/appointments");
  revalidatePath("/business/dashboard");

  return {
    success: true,
    message: "Randevu başarıyla yeniden planlandı.",
  };
}
