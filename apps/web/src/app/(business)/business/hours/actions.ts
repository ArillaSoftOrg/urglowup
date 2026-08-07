"use server";

import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { DayOfWeek } from "@/generated/prisma/enums";

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
const BUFFER_INTERVALS = [0, 5, 10, 15, 20, 30] as const;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export type HoursActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

type TimeBlock = {
  startTime: string;
  endTime: string;
};

function readTimeBlock(formData: FormData, day: DayOfWeek, key: string): TimeBlock | null {
  const startTime = String(formData.get(`${day}_${key}Start`) ?? "");
  const endTime = String(formData.get(`${day}_${key}End`) ?? "");

  if (!startTime && !endTime) return null;
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime) || endTime <= startTime) {
    throw new Error("Invalid time block");
  }

  return { startTime, endTime };
}

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
      appointmentBufferMinutes: 0,
      workBlocks: [{ startTime: "09:00", endTime: "18:00" }],
      breakBlocks: [],
    })),
  });
}

export async function saveBusinessHours(
  _prev: HoursActionState,
  formData: FormData
): Promise<HoursActionState> {
  const { businessId } = await requireBusiness("MANAGER");
  const errors: Record<string, string> = {};
  const updates: Array<{
    day: DayOfWeek;
    isOpen: boolean;
    openTime: string | null;
    closeTime: string | null;
    slotIntervalMinutes: number;
    appointmentBufferMinutes: number;
    workBlocks: TimeBlock[];
    breakBlocks: TimeBlock[];
    staffNotes: string | null;
    exceptionNotes: string | null;
  }> = [];

  for (const day of DAYS) {
    const isOpen = formData.get(`${day}_isOpen`) === "on";
    const openTime = String(formData.get(`${day}_openTime`) ?? "");
    const closeTime = String(formData.get(`${day}_closeTime`) ?? "");
    const slotIntervalMinutes = parseInt(String(formData.get(`${day}_slotIntervalMinutes`) ?? "30"), 10);
    const appointmentBufferMinutes = parseInt(
      String(formData.get(`${day}_appointmentBufferMinutes`) ?? "0"),
      10
    );
    const staffNotes = String(formData.get(`${day}_staffNotes`) ?? "").trim();
    const exceptionNotes = String(formData.get(`${day}_exceptionNotes`) ?? "").trim();

    if (!SLOT_INTERVALS.includes(slotIntervalMinutes as (typeof SLOT_INTERVALS)[number])) {
      errors[day] = "Geçersiz randevu aralığı";
      continue;
    }

    if (!BUFFER_INTERVALS.includes(appointmentBufferMinutes as (typeof BUFFER_INTERVALS)[number])) {
      errors[day] = "Geçersiz mola süresi";
      continue;
    }

    let workBlocks: TimeBlock[] = [];
    let breakBlocks: TimeBlock[] = [];

    try {
      workBlocks = [
        readTimeBlock(formData, day, "workBlock1"),
        readTimeBlock(formData, day, "workBlock2"),
      ].filter((block): block is TimeBlock => Boolean(block));
      breakBlocks = [
        readTimeBlock(formData, day, "breakBlock1"),
        readTimeBlock(formData, day, "breakBlock2"),
      ].filter((block): block is TimeBlock => Boolean(block));
    } catch {
      errors[day] = "Saat aralıklarını kontrol edin";
      continue;
    }

    if (isOpen) {
      if (!TIME_RE.test(openTime) || !TIME_RE.test(closeTime)) {
        errors[day] = "Açık günler için açılış ve kapanış saati zorunludur";
        continue;
      }

      if (closeTime <= openTime) {
        errors[day] = "Kapanış saati açılıştan sonra olmalıdır";
        continue;
      }

      if (workBlocks.length === 0) {
        workBlocks = [{ startTime: openTime, endTime: closeTime }];
      }

      if (
        workBlocks.some((block) => block.startTime < openTime || block.endTime > closeTime) ||
        breakBlocks.some((block) => block.startTime < openTime || block.endTime > closeTime)
      ) {
        errors[day] = "Bloklar günlük açılış ve kapanış içinde olmalıdır";
        continue;
      }
    }

    updates.push({
      day,
      isOpen,
      openTime: isOpen ? openTime : null,
      closeTime: isOpen ? closeTime : null,
      slotIntervalMinutes,
      appointmentBufferMinutes,
      workBlocks: isOpen ? workBlocks : [],
      breakBlocks: isOpen ? breakBlocks : [],
      staffNotes: staffNotes || null,
      exceptionNotes: exceptionNotes || null,
    });
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors, message: "Bazı günlerde hata var" };
  }

  await db.$transaction(
    updates.map((item) =>
      db.businessHour.upsert({
        where: { businessId_dayOfWeek: { businessId, dayOfWeek: item.day } },
        create: {
          businessId,
          dayOfWeek: item.day,
          isOpen: item.isOpen,
          openTime: item.openTime,
          closeTime: item.closeTime,
          slotIntervalMinutes: item.slotIntervalMinutes,
          appointmentBufferMinutes: item.appointmentBufferMinutes,
          workBlocks: item.workBlocks,
          breakBlocks: item.breakBlocks,
          staffNotes: item.staffNotes,
          exceptionNotes: item.exceptionNotes,
        },
        update: {
          isOpen: item.isOpen,
          openTime: item.openTime,
          closeTime: item.closeTime,
          slotIntervalMinutes: item.slotIntervalMinutes,
          appointmentBufferMinutes: item.appointmentBufferMinutes,
          workBlocks: item.workBlocks,
          breakBlocks: item.breakBlocks,
          staffNotes: item.staffNotes,
          exceptionNotes: item.exceptionNotes,
        },
      })
    )
  );

  revalidatePath("/business/hours");
  revalidatePath("/business/dashboard");
  return { success: true, message: "Çalışma saatleri kaydedildi" };
}
