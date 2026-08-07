import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDefaultHours } from "./actions";
import { syncTRHolidays, getHolidaysForYear } from "@/lib/holidays";
import {
  HoursManager,
  type HourData,
  type TimeBlockData,
} from "@/components/business/hours-manager";
import {
  HolidaySuggestions,
  type HolidayWithState,
} from "@/components/business/holiday-suggestions";

export const metadata = { title: "Çalışma Saatleri" };

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

function parseTimeBlocks(value: unknown): TimeBlockData[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TimeBlockData => {
    if (!item || typeof item !== "object") return false;
    const block = item as Record<string, unknown>;
    return typeof block.startTime === "string" && typeof block.endTime === "string";
  });
}

export default async function HoursPage() {
  const { businessId } = await requireBusiness("MANAGER");

  await ensureDefaultHours(businessId);

  const hours = await db.businessHour.findMany({
    where: { businessId },
  });

  const sorted: HourData[] = DAY_ORDER.map((day) => {
    const h = hours.find((x) => x.dayOfWeek === day);
    return {
      dayOfWeek: day,
      isOpen: h?.isOpen ?? false,
      openTime: h?.openTime ?? "09:00",
      closeTime: h?.closeTime ?? "18:00",
      slotIntervalMinutes: h?.slotIntervalMinutes ?? 30,
      appointmentBufferMinutes: h?.appointmentBufferMinutes ?? 0,
      workBlocks: parseTimeBlocks(h?.workBlocks),
      breakBlocks: parseTimeBlocks(h?.breakBlocks),
      staffNotes: h?.staffNotes ?? null,
      exceptionNotes: h?.exceptionNotes ?? null,
    };
  });

  // Load holidays — sync inline on first visit if cache is empty
  const currentYear = new Date().getFullYear();
  let holidays = await getHolidaysForYear(currentYear);
  if (holidays.length === 0) {
    await syncTRHolidays(currentYear);
    holidays = await getHolidaysForYear(currentYear);
  }

  // Load this business's suggestion states
  const suggestions = await db.businessHolidaySuggestion.findMany({
    where: { businessId, holiday: { year: currentYear } },
    select: { holidayId: true, state: true },
  });
  const stateMap = new Map(suggestions.map((s) => [s.holidayId, s.state]));

  // Build joined list — exclude DISMISSED so they stay hidden
  const holidaysWithState: HolidayWithState[] = holidays
    .map((h) => ({
      id: h.id,
      date: h.date.toISOString().slice(0, 10),
      name: h.name,
      state: stateMap.get(h.id) ?? null,
    }))
    .filter((h) => h.state !== "DISMISSED");

  return (
    <div className="space-y-8">
      <HoursManager initialHours={sorted} />
      <HolidaySuggestions holidays={holidaysWithState} year={currentYear} />
    </div>
  );
}
