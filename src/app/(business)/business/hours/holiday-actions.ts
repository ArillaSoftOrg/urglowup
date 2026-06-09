"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type HolidayActionState = {
  success: boolean;
  message?: string;
};

export async function applyHoliday(
  holidayId: string
): Promise<HolidayActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const holiday = await db.publicHoliday.findUnique({ where: { id: holidayId } });
  if (!holiday) return { success: false, message: "Holiday not found." };

  await db.businessHolidaySuggestion.upsert({
    where: { businessId_holidayId: { businessId, holidayId } },
    create: { businessId, holidayId, state: "APPLIED" },
    update: { state: "APPLIED" },
  });

  revalidatePath("/business/hours");
  return { success: true };
}

export async function dismissHoliday(
  holidayId: string
): Promise<HolidayActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const holiday = await db.publicHoliday.findUnique({ where: { id: holidayId } });
  if (!holiday) return { success: false, message: "Holiday not found." };

  await db.businessHolidaySuggestion.upsert({
    where: { businessId_holidayId: { businessId, holidayId } },
    create: { businessId, holidayId, state: "DISMISSED" },
    update: { state: "DISMISSED" },
  });

  revalidatePath("/business/hours");
  return { success: true };
}

export async function removeHolidayOverride(
  holidayId: string
): Promise<HolidayActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  await db.businessHolidaySuggestion.deleteMany({
    where: { businessId, holidayId },
  });

  revalidatePath("/business/hours");
  return { success: true };
}

export async function applyAllHolidays(
  year: number
): Promise<HolidayActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const holidays = await db.publicHoliday.findMany({
    where: { country: "TR", year },
  });

  const existing = await db.businessHolidaySuggestion.findMany({
    where: { businessId, holiday: { year } },
    select: { holidayId: true, state: true },
  });
  const existingMap = new Map(existing.map((s) => [s.holidayId, s.state]));

  for (const h of holidays) {
    const currentState = existingMap.get(h.id);
    if (currentState === "DISMISSED") continue;
    await db.businessHolidaySuggestion.upsert({
      where: { businessId_holidayId: { businessId, holidayId: h.id } },
      create: { businessId, holidayId: h.id, state: "APPLIED" },
      update: { state: "APPLIED" },
    });
  }

  revalidatePath("/business/hours");
  return { success: true };
}

export async function dismissAllHolidays(
  year: number
): Promise<HolidayActionState> {
  const { businessId } = await requireBusiness("MANAGER");

  const holidays = await db.publicHoliday.findMany({
    where: { country: "TR", year },
  });

  const existing = await db.businessHolidaySuggestion.findMany({
    where: { businessId, holiday: { year } },
    select: { holidayId: true, state: true },
  });
  const existingMap = new Map(existing.map((s) => [s.holidayId, s.state]));

  for (const h of holidays) {
    const currentState = existingMap.get(h.id);
    if (currentState === "APPLIED") continue;
    await db.businessHolidaySuggestion.upsert({
      where: { businessId_holidayId: { businessId, holidayId: h.id } },
      create: { businessId, holidayId: h.id, state: "DISMISSED" },
      update: { state: "DISMISSED" },
    });
  }

  revalidatePath("/business/hours");
  return { success: true };
}
