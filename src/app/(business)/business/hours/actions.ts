"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { DayOfWeek } from "@/generated/prisma/enums";

// ─── Constants ──────────────────────────────────────────────────

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const SLOT_INTERVALS = [15, 30, 45, 60] as const;

// ─── Types ──────────────────────────────────────────────────────

export type HoursActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

// ─── Helpers ────────────────────────────────────────────────────

export async function ensureDefaultHours(businessId: string) {
  const { businessId: authenticatedBusinessId } = await requireBusiness("MANAGER");
  if (businessId !== authenticatedBusinessId) {
    throw new Error("Unauthorized: business ID mismatch");
  }

  const count = await db.businessHour.count({ where: { businessId } });
  if (count > 0) return;

  await db.businessHour.createMany({
    data: DAYS.map((day) => ({
      businessId,
      dayOfWeek: day,
      isOpen: day !== "SUNDAY",
      openTime: "09:00",
      closeTime: "18:00",
      slotIntervalMinutes: 30,
    })),
  });
}

// ─── Actions ────────────────────────────────────────────────────

export async function saveBusinessHours(
  _prev: HoursActionState,
  formData: FormData
): Promise<HoursActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const errors: Record<string, string> = {};

  for (const day of DAYS) {
    const isOpen = formData.get(`${day}_isOpen`) === "on";
    const openTime = (formData.get(`${day}_openTime`) as string) ?? "";
    const closeTime = (formData.get(`${day}_closeTime`) as string) ?? "";
    const slotRaw = formData.get(`${day}_slotIntervalMinutes`) as string;
    const slotInterval = parseInt(slotRaw, 10) || 30;

    if (!SLOT_INTERVALS.includes(slotInterval as (typeof SLOT_INTERVALS)[number])) {
      errors[day] = "Geçersiz aralık değeri";
      continue;
    }

    if (isOpen) {
      if (!openTime || !closeTime) {
        errors[day] = "Açık günler için açılış ve kapanış saati zorunludur";
        continue;
      }
      if (closeTime <= openTime) {
        errors[day] = "Kapanış saati açılış saatinden sonra olmalıdır";
        continue;
      }
    }

    await db.businessHour.upsert({
      where: { businessId_dayOfWeek: { businessId, dayOfWeek: day } },
      create: {
        businessId,
        dayOfWeek: day,
        isOpen,
        openTime: isOpen ? openTime : null,
        closeTime: isOpen ? closeTime : null,
        slotIntervalMinutes: slotInterval,
      },
      update: {
        isOpen,
        openTime: isOpen ? openTime : null,
        closeTime: isOpen ? closeTime : null,
        slotIntervalMinutes: slotInterval,
      },
    });
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors, message: "Bazı günlerde hata var" };
  }

  revalidatePath("/business/hours");
  revalidatePath("/business/dashboard");
  return { success: true, message: "Çalışma saatleri kaydedildi" };
}
