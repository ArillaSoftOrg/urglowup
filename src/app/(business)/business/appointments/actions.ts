"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { STATUS_TRANSITIONS, TERMINAL_STATUSES, getDayOfWeek } from "@/lib/constants/booking";
import {
  hasSchedulingConflict,
  isWithinWorkingHours,
  type ConflictAppointment,
  type ConflictBlockedTime,
} from "@/lib/calendar";
import { getBusinessCalendarData } from "@/lib/queries/appointments";
import {
  serializeCalendarAppointment,
  serializeCalendarService,
} from "@/components/business/appointments/types";
import {
  sendConfirmedEmailToCustomer,
  sendRejectedEmailToCustomer,
  sendCancelledByBusinessEmailToCustomer,
  sendReviewRequestEmailToCustomer,
} from "@/lib/email-notifications";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export type AppointmentActionState = {
  success: boolean;
  message?: string;
  warning?: string;
  appointmentId?: string;
  blockedTimeId?: string;
};

// ─── Helpers ────────────────────────────────────────────────────

async function verifyOwnershipAndTransition(
  appointmentId: string,
  businessId: string,
  targetStatus: AppointmentStatus
): Promise<AppointmentActionState | null> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { businessId: true, status: true },
  });

  if (!appointment || appointment.businessId !== businessId) {
    return { success: false, message: "Appointment not found." };
  }

  const allowed = STATUS_TRANSITIONS[appointment.status];
  if (!allowed.includes(targetStatus)) {
    return {
      success: false,
      message: `Cannot change status from ${appointment.status} to ${targetStatus}.`,
    };
  }

  return null; // No error — proceed
}

function revalidate() {
  revalidatePath("/business/appointments");
  revalidatePath("/business/dashboard");
  revalidatePath("/account/appointments");
}

// ─── Status Actions ─────────────────────────────────────────────

export async function confirmAppointment(
  appointmentId: string
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();
  const err = await verifyOwnershipAndTransition(appointmentId, businessId, "CONFIRMED");
  if (err) return err;

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "CONFIRMED" },
  });

  after(async () => {
    try {
      await sendConfirmedEmailToCustomer(appointmentId);
    } catch (err) {
      console.error("[email] confirmAppointment:", err);
    }
  });

  revalidate();
  return { success: true, message: "Appointment confirmed." };
}

export async function rejectAppointment(
  appointmentId: string
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();
  const err = await verifyOwnershipAndTransition(appointmentId, businessId, "REJECTED");
  if (err) return err;

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "REJECTED" },
  });

  after(async () => {
    try {
      await sendRejectedEmailToCustomer(appointmentId);
    } catch (err) {
      console.error("[email] rejectAppointment:", err);
    }
  });

  revalidate();
  return { success: true, message: "Appointment rejected." };
}

export async function cancelAppointmentByBusiness(
  appointmentId: string
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();
  const err = await verifyOwnershipAndTransition(
    appointmentId,
    businessId,
    "CANCELLED_BY_BUSINESS"
  );
  if (err) return err;

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED_BY_BUSINESS" },
  });

  after(async () => {
    try {
      await sendCancelledByBusinessEmailToCustomer(appointmentId);
    } catch (err) {
      console.error("[email] cancelAppointmentByBusiness:", err);
    }
  });

  revalidate();
  return { success: true, message: "Appointment cancelled." };
}

export async function completeAppointment(
  appointmentId: string
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();
  const err = await verifyOwnershipAndTransition(appointmentId, businessId, "COMPLETED");
  if (err) return err;

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" },
  });

  after(async () => {
    try {
      await sendReviewRequestEmailToCustomer(appointmentId);
    } catch (err) {
      console.error("[email] completeAppointment:", err);
    }
  });

  revalidate();
  return { success: true, message: "Appointment marked as completed." };
}

export async function markNoShow(
  appointmentId: string
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();
  const err = await verifyOwnershipAndTransition(appointmentId, businessId, "NO_SHOW");
  if (err) return err;

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "NO_SHOW" },
  });

  revalidate();
  return { success: true, message: "Appointment marked as no-show." };
}

// ─── Business Note ──────────────────────────────────────────────

const noteSchema = z.object({
  note: z.string().max(500, "Note must be under 500 characters"),
});

export async function updateBusinessNote(
  appointmentId: string,
  note: string
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { businessId: true },
  });

  if (!appointment || appointment.businessId !== businessId) {
    return { success: false, message: "Appointment not found." };
  }

  const result = noteSchema.safeParse({ note });
  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: { businessNote: result.data.note || null },
  });

  revalidate();
  return { success: true, message: "Note updated." };
}

export async function checkInAppointment(
  appointmentId: string
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();
  const err = await verifyOwnershipAndTransition(appointmentId, businessId, "CHECKED_IN");
  if (err) return err;

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "CHECKED_IN" },
  });

  revalidate();
  return { success: true, message: "Customer checked in." };
}

// ─── Calendar: Create / Reschedule Appointment ──────────────────

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçersiz saat");

const createAppointmentSchema = z.object({
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  professionalId: z.string().min(1).nullable(),
  date: dateSchema,
  startTime: timeSchema,
  notes: z.string().max(500).optional(),
});

const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  date: dateSchema,
  startTime: timeSchema,
  professionalId: z.string().min(1).nullable(),
  serviceId: z.string().min(1).optional(),
});

/** Loads same-day appointments + blocked times for conflict checking. */
async function getConflictContext(
  businessId: string,
  date: string
): Promise<{ appointments: ConflictAppointment[]; blockedTimes: ConflictBlockedTime[] }> {
  const dateObj = new Date(`${date}T00:00:00.000Z`);

  const [appointments, blockedTimes] = await Promise.all([
    db.appointment.findMany({
      where: { businessId, requestedDate: dateObj },
      select: {
        id: true,
        requestedDate: true,
        requestedTime: true,
        professionalId: true,
        status: true,
        service: { select: { durationMinutes: true } },
      },
    }),
    db.blockedTime.findMany({
      where: { businessId, date: dateObj },
      select: { id: true, date: true, startTime: true, endTime: true, professionalId: true },
    }),
  ]);

  return {
    appointments: appointments.map((appt) => ({
      id: appt.id,
      requestedDate: appt.requestedDate,
      requestedTime: appt.requestedTime,
      durationMinutes: appt.service.durationMinutes,
      professionalId: appt.professionalId,
      status: appt.status,
    })),
    blockedTimes,
  };
}

export async function createAppointment(
  input: z.input<typeof createAppointmentSchema>
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();

  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }
  const { customerId, serviceId, professionalId, date, startTime, notes } = parsed.data;

  const hasPriorRelationship = await db.appointment.findFirst({
    where: { businessId, customerId },
    select: { id: true },
  });
  if (!hasPriorRelationship) {
    return { success: false, message: "Müşteri bu işletmeyle eşleşmiyor." };
  }

  const service = await db.businessService.findFirst({
    where: { id: serviceId, businessId, isActive: true },
    select: { durationMinutes: true },
  });
  if (!service) {
    return { success: false, message: "Hizmet bulunamadı." };
  }

  if (professionalId) {
    const professional = await db.professional.findFirst({
      where: { id: professionalId, businessId, isActive: true },
      select: { id: true },
    });
    if (!professional) {
      return { success: false, message: "Personel bulunamadı." };
    }
  }

  const { appointments, blockedTimes } = await getConflictContext(businessId, date);

  if (
    hasSchedulingConflict(
      { date, startTime, durationMinutes: service.durationMinutes, professionalId },
      appointments,
      blockedTimes
    )
  ) {
    return { success: false, message: "Bu saatte çakışan bir randevu veya blokaj var." };
  }

  const businessHour = await db.businessHour.findUnique({
    where: { businessId_dayOfWeek: { businessId, dayOfWeek: getDayOfWeek(date) } },
  });
  const withinHours = isWithinWorkingHours(startTime, service.durationMinutes, businessHour ?? undefined);

  const created = await db.appointment.create({
    data: {
      businessId,
      customerId,
      serviceId,
      professionalId,
      requestedDate: new Date(`${date}T00:00:00.000Z`),
      requestedTime: startTime,
      status: "CONFIRMED",
      businessNote: notes || null,
    },
    select: { id: true },
  });

  revalidate();
  return {
    success: true,
    message: "Randevu oluşturuldu.",
    appointmentId: created.id,
    warning: withinHours ? undefined : "Bu saat çalışma saatleri dışında.",
  };
}

export async function rescheduleAppointment(
  input: z.input<typeof rescheduleAppointmentSchema>
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();

  const parsed = rescheduleAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }
  const { appointmentId, date, startTime, professionalId, serviceId } = parsed.data;

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { businessId: true, status: true, serviceId: true },
  });
  if (!appointment || appointment.businessId !== businessId) {
    return { success: false, message: "Randevu bulunamadı." };
  }
  if (TERMINAL_STATUSES.includes(appointment.status)) {
    return { success: false, message: "Tamamlanmış veya iptal edilmiş randevu değiştirilemez." };
  }

  const effectiveServiceId = serviceId ?? appointment.serviceId;
  const service = await db.businessService.findFirst({
    where: { id: effectiveServiceId, businessId, isActive: true },
    select: { durationMinutes: true },
  });
  if (!service) {
    return { success: false, message: "Hizmet bulunamadı." };
  }

  if (professionalId) {
    const professional = await db.professional.findFirst({
      where: { id: professionalId, businessId, isActive: true },
      select: { id: true },
    });
    if (!professional) {
      return { success: false, message: "Personel bulunamadı." };
    }
  }

  const { appointments, blockedTimes } = await getConflictContext(businessId, date);

  if (
    hasSchedulingConflict(
      {
        date,
        startTime,
        durationMinutes: service.durationMinutes,
        professionalId,
        excludeAppointmentId: appointmentId,
      },
      appointments,
      blockedTimes
    )
  ) {
    return { success: false, message: "Bu saatte çakışan bir randevu veya blokaj var." };
  }

  const businessHour = await db.businessHour.findUnique({
    where: { businessId_dayOfWeek: { businessId, dayOfWeek: getDayOfWeek(date) } },
  });
  const withinHours = isWithinWorkingHours(startTime, service.durationMinutes, businessHour ?? undefined);

  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      requestedDate: new Date(`${date}T00:00:00.000Z`),
      requestedTime: startTime,
      professionalId,
      serviceId: effectiveServiceId,
    },
  });

  revalidate();
  return {
    success: true,
    message: "Randevu güncellendi.",
    appointmentId,
    warning: withinHours ? undefined : "Bu saat çalışma saatleri dışında.",
  };
}

// ─── Calendar: Blocked Time ──────────────────────────────────────

const blockedTimeSchema = z
  .object({
    professionalId: z.string().min(1).nullable(),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    reason: z.string().max(200).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Bitiş saati başlangıç saatinden sonra olmalı.",
    path: ["endTime"],
  });

export async function createBlockedTime(
  input: z.input<typeof blockedTimeSchema>
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();

  const parsed = blockedTimeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }
  const { professionalId, date, startTime, endTime, reason } = parsed.data;

  if (professionalId) {
    const professional = await db.professional.findFirst({
      where: { id: professionalId, businessId, isActive: true },
      select: { id: true },
    });
    if (!professional) {
      return { success: false, message: "Personel bulunamadı." };
    }
  }

  const created = await db.blockedTime.create({
    data: {
      businessId,
      professionalId,
      date: new Date(`${date}T00:00:00.000Z`),
      startTime,
      endTime,
      reason: reason || null,
    },
    select: { id: true },
  });

  revalidate();
  return { success: true, message: "Zaman bloklandı.", blockedTimeId: created.id };
}

export async function deleteBlockedTime(
  blockedTimeId: string
): Promise<AppointmentActionState> {
  const { businessId } = await requireBusiness();

  const blockedTime = await db.blockedTime.findUnique({
    where: { id: blockedTimeId },
    select: { businessId: true },
  });
  if (!blockedTime || blockedTime.businessId !== businessId) {
    return { success: false, message: "Blokaj bulunamadı." };
  }

  await db.blockedTime.delete({ where: { id: blockedTimeId } });

  revalidate();
  return { success: true, message: "Blokaj kaldırıldı." };
}

// ─── Calendar: Range Refetch ─────────────────────────────────────

export async function getCalendarDataForRange(rangeStart: string, rangeEnd: string) {
  const { businessId } = await requireBusiness();

  const data = await getBusinessCalendarData(businessId, {
    rangeStart: new Date(`${rangeStart}T00:00:00.000Z`),
    rangeEnd: new Date(`${rangeEnd}T00:00:00.000Z`),
  });

  return {
    ...data,
    appointments: data.appointments.map(serializeCalendarAppointment),
    services: data.services.map(serializeCalendarService),
  };
}
