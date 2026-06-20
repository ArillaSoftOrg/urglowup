"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";
import { db } from "@/lib/db";

const slugSchema = z.object({
  slug: z
    .string()
    .min(3, "En az 3 karakter olmalı")
    .max(60, "En fazla 60 karakter olabilir")
    .regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire (-) kullanılabilir")
    .refine((v) => !v.startsWith("-") && !v.endsWith("-"), "Tire ile başlayamaz veya bitemez"),
});

export type SlugActionState =
  | { success: true; newSlug: string }
  | { success: false; error: string };

export async function updateBusinessSlug(
  _prev: SlugActionState,
  formData: FormData
): Promise<SlugActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const result = slugSchema.safeParse({ slug: formData.get("slug") });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { slug } = result.data;

  const existing = await db.business.findUnique({
    where: { id: businessId },
    select: { slug: true },
  });
  if (!existing) return { success: false, error: "İşletme bulunamadı." };
  if (existing.slug === slug) return { success: true, newSlug: slug };

  const taken = await db.business.findUnique({ where: { slug }, select: { id: true } });
  if (taken) return { success: false, error: "Bu URL zaten kullanımda. Farklı bir tane deneyin." };

  await db.business.update({ where: { id: businessId }, data: { slug } });

  revalidatePath("/business/public-link");
  revalidatePath(`/b/${existing.slug}`);
  revalidatePath(`/b/${slug}`);
  await invalidateCache(`business:slug:${existing.slug}`);
  await invalidateCache(`business:slug:${slug}`);

  return { success: true, newSlug: slug };
}
