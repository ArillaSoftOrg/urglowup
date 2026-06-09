"use server";

import { z } from "zod";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { geocodeBusinessAddress } from "@/lib/maps/geocoding";

const profileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional().transform((v) => v || null),
  phone: z.string().max(30).optional().transform((v) => v || null),
  whatsapp: z.string().max(30).optional().transform((v) => v || null),
  instagramUrl: z
    .string()
    .max(200)
    .optional()
    .transform((v) => v || null),
  address: z.string().max(300).optional().transform((v) => v || null),
  city: z.string().max(100).optional().transform((v) => v || null),
  district: z.string().max(100).optional().transform((v) => v || null),
});

export type ProfileActionState =
  | { success: true; message: string }
  | { success: false; errors?: Record<string, string[]>; message?: string };

export async function updateBusinessProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    instagramUrl: formData.get("instagramUrl"),
    address: formData.get("address"),
    city: formData.get("city"),
    district: formData.get("district"),
  };

  const result = profileSchema.safeParse(raw);
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const [key, issues] of Object.entries(result.error.flatten().fieldErrors)) {
      errors[key] = issues ?? [];
    }
    return { success: false, errors };
  }

  const existing = await db.business.findUnique({
    where: { id: businessId },
    select: { slug: true, address: true, city: true, district: true },
  });

  if (!existing) return { success: false, message: "Business not found." };

  await db.business.update({
    where: { id: businessId },
    data: result.data,
  });

  revalidatePath("/business/profile");
  revalidatePath(`/b/${existing.slug}`);

  // Trigger geocoding if any address field changed
  const addressChanged =
    (result.data.address ?? null) !== existing.address ||
    (result.data.city ?? null) !== existing.city ||
    (result.data.district ?? null) !== existing.district;

  if (addressChanged) {
    const fullAddress = [result.data.address, result.data.district, result.data.city]
      .filter(Boolean)
      .join(", ");
    if (fullAddress) {
      after(() => geocodeBusinessAddress(businessId, fullAddress));
    }
  }

  return { success: true, message: "Profile updated successfully." };
}
