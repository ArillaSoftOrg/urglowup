"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { generateTimeSlots } from "@/lib/slots";
import type { TimeBlock } from "@/lib/slots";
import { isSuspended } from "@/lib/admin/user-suspension";
import {
  MIN_ADVANCE_HOURS,
  MAX_ADVANCE_DAYS,
  BLOCKING_STATUSES,
  nowInBusinessTimezone,
  getDayOfWeek,
} from "@/lib/constants/booking";
import {
  sendNewRequestEmailToBusiness,
  sendRequestReceivedEmailToCustomer,
} from "@/lib/email-notifications";
import { notifyBusinessAppointmentRequested } from "@/lib/in-app-notifications";
import { sendBookingConfirmationWhatsApp } from "@/lib/whatsapp-notifications";
import { validateBotProtection } from "@/lib/bot-protection";

// ─── Schemas ────────────────────────────────────────────────────

const bookingRequestSchema = z.object({
  businessId: z.string().min(1, "İşletme bilgisi eksik."),
  serviceId: z.string().min(1, "Hizmet seçimi eksik."),
  professionalId: z.string().optional().or(z.literal("")),
  itemsJson: z.string().optional().or(z.literal("")),
  firstVisit: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  couponId: z.string().optional().or(z.literal("")),
  discountAmount: z.coerce.number().nonnegative().optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih biçimi."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat biçimi."),
  customerNote: z
    .string()
    .max(500, "Not 500 karakterden uzun olamaz.")
    .optional()
    .or(z.literal("")),
});

const bookingItemSchema = z.object({
  guestName: z.string().min(1).max(80),
  guestIndex: z.number().int().min(0).max(20),
  serviceId: z.string().min(1),
  professionalId: z.string().nullable().optional(),
});

const bookingItemsSchema = z.array(bookingItemSchema).min(1).max(50);

// ─── Types ──────────────────────────────────────────────────────

export type BookingActionState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

function parseTimeBlocks(value: unknown): TimeBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TimeBlock => {
    if (!item || typeof item !== "object") return false;
    const block = item as Record<string, unknown>;
    return typeof block.startTime === "string" && typeof block.endTime === "string";
  });
}

// ─── Get Available Slots ────────────────────────────────────────

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateString: string,
  durationOverrideMinutes?: number
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

  // Check for an applied holiday closure on this specific date (precedence #2)
  const appliedHoliday = await db.businessHolidaySuggestion.findFirst({
    where: {
      businessId,
      state: "APPLIED",
      holiday: { date: new Date(dateString) },
    },
  });
  if (appliedHoliday) return [];

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

  const requestedDuration = durationOverrideMinutes ?? service.durationMinutes;
  if (!Number.isInteger(requestedDuration) || requestedDuration < 5 || requestedDuration > 24 * 60) {
    return [];
  }

  // Get existing blocking appointments for this date
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

  // Calculate minTimeMinutes for today
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
    }
  );
}

// ─── Create Appointment Request ─────────────────────────────────

export async function createAppointmentRequest(
  _prev: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const botProtectionError = await validateBotProtection(formData);
  if (botProtectionError) {
    return { success: false, message: botProtectionError };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Randevu talep etmek için giriş yapmalısınız." };
  }

  if (isSuspended(user)) {
    return { success: false, message: "Hesabınız askıya alınmıştır. Destek ile iletişime geçin." };
  }

  const raw = Object.fromEntries(formData.entries());
  const result = bookingRequestSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return {
      success: false,
      errors: fieldErrors,
      message: "Lütfen form bilgilerini kontrol edip tekrar deneyin.",
    };
  }

  const { businessId, serviceId, professionalId, couponId, discountAmount, date, time, customerNote } = result.data;

  try {
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
      return { success: false, message: "Bu işletme şu anda randevu almıyor." };
    }

    // Verify service exists and is active
    const service = await db.businessService.findFirst({
      where: { id: serviceId, businessId, isActive: true },
      select: { id: true, durationMinutes: true },
    });
    if (!service) {
      return { success: false, message: "Bu hizmet artık sunulmuyor." };
    }

    // Verify date is valid
    const now = nowInBusinessTimezone();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (date < todayStr) {
      return { success: false, message: "Geçmiş bir tarih seçemezsiniz." };
    }

    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
    const requestedDate = new Date(date + "T00:00:00");
    if (requestedDate > maxDate) {
      return { success: false, message: `En fazla ${MAX_ADVANCE_DAYS} gün öncesinden randevu alabilirsiniz.` };
    }

    // Verify slot is still available
    const availableSlots = await getAvailableSlots(businessId, serviceId, date);
    if (!availableSlots.includes(time)) {
      return { success: false, message: "Bu saat artık dolu. Lütfen başka bir saat seçin." };
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
      return { success: false, message: "Bu saatte zaten bir randevu talebiniz var." };
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        businessId,
        customerId: user.id,
        serviceId,
        professionalId: professionalId || null,
        couponId: couponId || null,
        discountAmount: discountAmount ? discountAmount : null,
        requestedDate: new Date(date),
        requestedTime: time,
        status: "PENDING",
        customerNote: customerNote || null,
      },
    });

    // Increment coupon usage count
    if (couponId) {
      after(async () => {
        try {
          await db.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
          });
        } catch (err) {
          console.error("[coupon] increment usedCount:", err);
        }
      });
    }

    // Email to business owner — independent of customer email
    after(async () => {
      try {
        await sendNewRequestEmailToBusiness(appointment.id);
      } catch (err) {
        console.error("[email] createAppointmentRequest → business:", err);
      }
    });

    // Email to customer — independent of business owner email
    after(async () => {
      try {
        await sendRequestReceivedEmailToCustomer(appointment.id);
      } catch (err) {
        console.error("[email] createAppointmentRequest → customer:", err);
      }
    });

    // WhatsApp confirmation to customer — errors absorbed internally, never breaks booking
    after(async () => {
      try {
        await sendBookingConfirmationWhatsApp(appointment.id);
      } catch (err) {
        console.error("[whatsapp] createAppointmentRequest → unexpected:", err);
      }
    });

    after(async () => {
      try {
        await notifyBusinessAppointmentRequested(appointment.id);
      } catch (err) {
        console.error("[in-app] createAppointmentRequest -> business:", err);
      }
    });

    revalidatePath("/account/appointments");
    revalidatePath("/business/appointments");
    revalidatePath("/business/dashboard");

    return { success: true, message: "Randevu talebiniz alındı!" };
  } catch (err) {
    console.error("[createAppointmentRequest]", err);
    return { success: false, message: "İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin." };
  }
}
