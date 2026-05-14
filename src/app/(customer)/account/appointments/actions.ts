"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { CUSTOMER_CANCELLABLE } from "@/lib/constants/booking";
import { sendCancelledByCustomerEmailToBusiness } from "@/lib/email-notifications";

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
      console.error("[email] cancelAppointment:", err);
    }
  });

  revalidatePath("/account/appointments");
  revalidatePath("/business/appointments");
  revalidatePath("/business/dashboard");

  return { success: true, message: "Appointment cancelled." };
}
