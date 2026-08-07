"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

const addressSchema = z.object({
  serviceAddress: z.string().max(300).optional().or(z.literal("")),
});

export type AddressFormState = {
  success: boolean;
  message?: string;
};

export async function updateServiceAddress(
  _prev: AddressFormState,
  formData: FormData
): Promise<AddressFormState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const raw = { serviceAddress: formData.get("serviceAddress") as string };
  const result = addressSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, message: "Geçersiz adres." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { serviceAddress: result.data.serviceAddress || null },
  });

  revalidatePath("/account/address");
  return { success: true, message: "Adres kaydedildi." };
}
