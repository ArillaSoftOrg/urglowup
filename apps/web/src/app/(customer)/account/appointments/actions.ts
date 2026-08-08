"use server";

import { getCurrentUser } from "@/lib/auth";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import {
  sendCancelledByCustomerEmailToBusiness,
  sendCancellationConfirmationEmailToCustomer,
  sendRescheduleRequestEmailToBusiness,
  sendConfirmedEmailToCustomer,
} from "@/lib/email-notifications";
import {
  notifyBusinessAppointmentCancelledByCustomer,
  notifyBusinessAppointmentRescheduledByCustomer,
} from "@/lib/in-app-notifications";
import { notifyWaitlist } from "@/app/(public)/b/[slug]/book/waitlist-actions";
import {
  cancelAppointment as cancelAppointmentForCustomer,
  rescheduleAppointment as rescheduleAppointmentForCustomer,
} from "@urglowup/domain/booking";

export type AppointmentActionState = {
  success: boolean;
  message?: string;
};

export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated." };
  }

  const result = await cancelAppointmentForCustomer(user.id, appointmentId, reason);

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      NOT_FOUND: "Appointment not found.",
      NOT_CANCELLABLE: "This appointment can no longer be cancelled.",
      TOO_CLOSE_TO_START: "Onaylanmış randevular en geç 2 saat öncesine kadar iptal edilebilir.",
    };
    return { success: false, message: messages[result.reason] };
  }

  const { appointment } = result;

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
      const dateStr = appointment.requestedDate.toISOString().slice(0, 10);
      await notifyWaitlist(appointment.businessId, appointment.serviceId, dateStr, appointment.requestedTime);
    } catch (err) {
      console.error("[waitlist] cancelAppointment:", err);
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

  const result = await rescheduleAppointmentForCustomer(user.id, appointmentId, date, time);

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      NOT_FOUND: "Randevu bulunamadı.",
      NOT_RESCHEDULABLE: "Bu randevu yeniden planlanamaz.",
      PAST_DATE: "Geçmiş bir tarih seçemezsiniz.",
      CLOSED: "Bu gün için randevu alınamıyor.",
      CONFLICT: "Bu saatte çakışan bir randevu var. Başka bir saat seçin.",
      OUTSIDE_WORKING_HOURS: "Bu saat çalışma saatleri dışında. Lütfen başka bir saat seçin.",
    };
    return { success: false, message: messages[result.reason] };
  }

  after(async () => {
    try {
      await sendRescheduleRequestEmailToBusiness(appointmentId, date, time);
    } catch (err) {
      console.error("[email] rescheduleAppointment → business:", err);
    }
  });

  after(async () => {
    try {
      await sendConfirmedEmailToCustomer(appointmentId);
    } catch (err) {
      console.error("[email] rescheduleAppointment → customer:", err);
    }
  });

  after(async () => {
    try {
      await notifyBusinessAppointmentRescheduledByCustomer(appointmentId);
    } catch (err) {
      console.error("[in-app] rescheduleAppointment → business:", err);
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
