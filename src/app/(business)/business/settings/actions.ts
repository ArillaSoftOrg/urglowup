"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";

export type GroupBookingSettingsState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const groupBookingSettingsSchema = z.object({
  maxGroupBookingGuests: z.coerce
    .number()
    .int()
    .min(1, "En az 1 kişi olabilir.")
    .max(10, "En fazla 10 kişi olabilir."),
});

export type CancellationSettingsState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const cancellationSettingsSchema = z.object({
  cancellationWindowHours: z.coerce
    .number()
    .int()
    .min(0, "0 veya daha büyük bir değer girin.")
    .max(168, "En fazla 168 saat (1 hafta) olabilir."),
});

export async function updateCancellationSettings(
  _prev: CancellationSettingsState,
  formData: FormData
): Promise<CancellationSettingsState> {
  const { businessId } = await requireBusiness("MANAGER");

  const result = cancellationSettingsSchema.safeParse({
    cancellationWindowHours: formData.get("cancellationWindowHours"),
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      success: false,
      errors: issue.path[0] ? { [String(issue.path[0])]: issue.message } : undefined,
      message: issue.message,
    };
  }

  await db.business.update({
    where: { id: businessId },
    data: { cancellationWindowHours: result.data.cancellationWindowHours },
  });

  revalidatePath("/business/settings");
  return { success: true, message: "İptal politikası güncellendi." };
}

export async function updateGroupBookingSettings(
  _prev: GroupBookingSettingsState,
  formData: FormData
): Promise<GroupBookingSettingsState> {
  const { businessId } = await requireBusiness("MANAGER");

  const result = groupBookingSettingsSchema.safeParse({
    maxGroupBookingGuests: formData.get("maxGroupBookingGuests"),
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      success: false,
      errors: issue.path[0] ? { [String(issue.path[0])]: issue.message } : undefined,
      message: issue.message,
    };
  }

  await db.business.update({
    where: { id: businessId },
    data: { maxGroupBookingGuests: result.data.maxGroupBookingGuests },
  });

  revalidatePath("/business/settings");
  return { success: true, message: "Grup randevu ayarları güncellendi." };
}
