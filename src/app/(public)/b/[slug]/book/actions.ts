"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { generateTimeSlots } from "@/lib/slots";
import {
  MIN_ADVANCE_HOURS,
  MAX_ADVANCE_DAYS,
  BLOCKING_STATUSES,
  nowInBusinessTimezone,
} from "@/lib/constants/booking";
import type { DayOfWeek } from "@/generated/prisma/enums";

// ─── Schemas ────────────────────────────────────────────────────

const bookingRequestSchema = z.object({
  businessId: z.string().min(1, "Business is required"),
  serviceId: z.string().min(1, "Service is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  customerNote: z
    .string()
    .max(500, "Note must be under 500 characters")
    .optional()
    .or(z.literal("")),
});

// ─── Types ──────────────────────────────────────────────────────

export type BookingActionState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

// ─── Helpers ────────────────────────────────────────────────────

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

function getDayOfWeek(dateString: string): DayOfWeek {
  const d = new Date(dateString + "T00:00:00");
  return DAY_MAP[d.getDay()];
}

// ─── Get Available Slots ────────────────────────────────────────

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateString: string
): Promise<string[]> {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return [];

  const now = nowInBusinessTimezone();
  const requestedDate = new Date(dateString + "T00:00:00");

  // Date must not be in the past
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateString < todayStr) return [];

  // Date must not exceed max advance days
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
  if (requestedDate > maxDate) return [];

  // Get business hour for this day of week
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

  // Get existing blocking appointments for this date
  const existingAppointments = await db.appointment.findMany({
    where: {
      businessId,
      requestedDate: new Date(dateString),
      status: { in: BLOCKING_STATUSES },
    },
    select: {
      requestedTime: true,
      service: { select: { durationMinutes: true } },
    },
  });

  const occupied = existingAppointments.map((a) => ({
    requestedTime: a.requestedTime,
    durationMinutes: a.service.durationMinutes,
  }));

  // Calculate minTimeMinutes for today
  let minTimeMinutes: number | undefined;
  if (dateString === todayStr) {
    minTimeMinutes = now.getHours() * 60 + now.getMinutes() + MIN_ADVANCE_HOURS * 60;
  }

  return generateTimeSlots(
    hour.openTime,
    hour.closeTime,
    hour.slotIntervalMinutes,
    service.durationMinutes,
    occupied,
    minTimeMinutes
  );
}

// ─── Create Appointment Request ─────────────────────────────────

export async function createAppointmentRequest(
  _prev: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Please log in to request an appointment." };
  }

  const raw = Object.fromEntries(formData.entries());
  const result = bookingRequestSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { success: false, errors: fieldErrors };
  }

  const { businessId, serviceId, date, time, customerNote } = result.data;

  // Verify business exists and is bookable
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { status: true },
  });
  if (
    !business ||
    business.status === "SUSPENDED" ||
    business.status === "REJECTED"
  ) {
    return { success: false, message: "This business is not available for booking." };
  }

  // Verify service exists and is active
  const service = await db.businessService.findFirst({
    where: { id: serviceId, businessId, isActive: true },
    select: { id: true, durationMinutes: true },
  });
  if (!service) {
    return { success: false, message: "This service is no longer available." };
  }

  // Verify date is valid
  const now = nowInBusinessTimezone();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (date < todayStr) {
    return { success: false, message: "Cannot book a date in the past." };
  }

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
  const requestedDate = new Date(date + "T00:00:00");
  if (requestedDate > maxDate) {
    return { success: false, message: `Cannot book more than ${MAX_ADVANCE_DAYS} days in advance.` };
  }

  // Verify slot is still available
  const availableSlots = await getAvailableSlots(businessId, serviceId, date);
  if (!availableSlots.includes(time)) {
    return { success: false, message: "This time slot is no longer available. Please select another." };
  }

  // Check if customer already has a PENDING/CONFIRMED appointment at same business/date/time
  const duplicate = await db.appointment.findFirst({
    where: {
      customerId: user.id,
      businessId,
      requestedDate: new Date(date),
      requestedTime: time,
      status: { in: BLOCKING_STATUSES },
    },
  });
  if (duplicate) {
    return { success: false, message: "You already have a booking request at this time." };
  }

  // Create appointment
  await db.appointment.create({
    data: {
      businessId,
      customerId: user.id,
      serviceId,
      requestedDate: new Date(date),
      requestedTime: time,
      status: "PENDING",
      customerNote: customerNote || null,
    },
  });

  revalidatePath("/account/appointments");
  revalidatePath("/business/appointments");
  revalidatePath("/business/dashboard");

  return { success: true, message: "Appointment request submitted!" };
}
