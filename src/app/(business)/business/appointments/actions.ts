"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { STATUS_TRANSITIONS } from "@/lib/constants/booking";
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
