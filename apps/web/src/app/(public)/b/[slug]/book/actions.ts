"use server";

import { getCurrentUser } from "@/lib/auth";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { isSuspended } from "@/lib/admin/user-suspension";
import {
  sendNewRequestEmailToBusiness,
  sendRequestReceivedEmailToCustomer,
} from "@/lib/email-notifications";
import { notifyBusinessAppointmentRequested } from "@/lib/in-app-notifications";
import { sendBookingConfirmationWhatsApp } from "@/lib/whatsapp-notifications";
import { validateBotProtection } from "@/lib/bot-protection";
import { enforceRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { createAppointment, getAvailableSlots, prepareBookingRequest } from "@urglowup/domain/booking";
import { sendPushToUser } from "@urglowup/domain/notifications";

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
  idempotencyKey: z.string().min(1).max(200).optional().or(z.literal("")),
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

function parseBookingItems(
  raw: string | undefined,
  fallback: { serviceId: string; professionalId?: string | null }
) {
  if (!raw) {
    return [
      {
        guestName: "Ben",
        guestIndex: 0,
        serviceId: fallback.serviceId,
        professionalId: fallback.professionalId || null,
      },
    ];
  }

  try {
    const parsed = bookingItemsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ─── Get Available Slots ────────────────────────────────────────

// Re-exported so existing callers (Server Action RPC from client components)
// don't need to change their import path. Backend-authoritative logic lives
// in packages/domain/src/booking/availability.ts.
export { getAvailableSlots };

// ─── Create Appointment Request ─────────────────────────────────

const PREPARE_FAILURE_MESSAGES: Record<
  Exclude<Awaited<ReturnType<typeof prepareBookingRequest>>, { ok: true }>["reason"],
  string
> = {
  BUSINESS_NOT_BOOKABLE: "Bu işletme şu anda randevu almıyor.",
  GROUP_SIZE_EXCEEDED: "Bu işletme bu kadar kişilik grup randevusu almıyor.",
  SERVICE_UNAVAILABLE: "Seçili hizmetlerden biri artık sunulmuyor.",
  PROFESSIONAL_UNAVAILABLE: "Seçili uzmanlardan biri bu hizmeti sunmuyor.",
  NO_ITEMS: "Hizmet seçimi eksik.",
  PAST_DATE: "Geçmiş bir tarih seçemezsiniz.",
  TOO_FAR_IN_ADVANCE: "Çok ileri bir tarih seçtiniz.",
  SLOT_TAKEN: "Bu saat artık dolu. Lütfen başka bir saat seçin.",
};

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

  const rateLimit = await enforceRateLimit({
    scope: "booking",
    headers: await headers(),
    subjectId: user.id,
    ipLimit: 40,
    subjectLimit: 20,
  });
  if (!rateLimit.ok) {
    return { success: false, message: rateLimit.message };
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

  const {
    businessId,
    serviceId,
    professionalId,
    itemsJson,
    firstVisit,
    couponId,
    discountAmount,
    date,
    time,
    customerNote,
    idempotencyKey,
  } = result.data;

  try {
    const parsedItems = parseBookingItems(itemsJson || undefined, {
      serviceId,
      professionalId: professionalId || null,
    });
    if (!parsedItems) {
      return { success: false, message: "Hizmet seçimlerinizi kontrol edip tekrar deneyin." };
    }

    const prepared = await prepareBookingRequest({
      businessId,
      customerId: user.id,
      date,
      time,
      items: parsedItems.map((item) => ({
        guestName: item.guestName,
        guestIndex: item.guestIndex,
        serviceId: item.serviceId,
        professionalId: item.professionalId || null,
      })),
      couponId: couponId || null,
      discountAmount: discountAmount ? discountAmount : null,
      firstVisit: firstVisit ?? null,
      customerNote: customerNote || null,
      idempotencyKey: idempotencyKey || undefined,
    });

    if (!prepared.ok) {
      return { success: false, message: PREPARE_FAILURE_MESSAGES[prepared.reason] };
    }

    // Create appointment. Slot-conflict, duplicate-booking, and coupon-limit
    // checks all happen atomically inside this call (transaction + Postgres
    // advisory lock, with a unique-index backstop) so two concurrent
    // requests for the same slot can't both succeed.
    const creation = await createAppointment(prepared.input);

    if (!creation.ok) {
      const messages: Record<typeof creation.reason, string> = {
        SLOT_TAKEN: "Bu saat artık dolu. Lütfen başka bir saat seçin.",
        DUPLICATE_CUSTOMER_BOOKING: "Bu saatte zaten bir randevu talebiniz var.",
        COUPON_EXHAUSTED: "Bu kupon artık kullanılamıyor.",
      };
      return { success: false, message: messages[creation.reason] };
    }

    const appointment = { id: creation.appointmentId };

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

    // No-op if the customer has no registered device (most web bookings) —
    // only sends if they'd previously signed into the mobile app too.
    after(async () => {
      try {
        await sendPushToUser(user.id, {
          title: "Randevu talebiniz alındı",
          body: "İşletme onayladığında bilgilendirileceksiniz.",
          data: { appointmentId: appointment.id, type: "APPOINTMENT_REQUESTED" },
        });
      } catch (err) {
        console.error("[push] createAppointmentRequest:", err);
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
