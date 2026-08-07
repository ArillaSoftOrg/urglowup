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
