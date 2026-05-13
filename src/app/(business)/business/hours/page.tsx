import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDefaultHours } from "./actions";
import {
  HoursManager,
  type HourData,
} from "@/components/business/hours-manager";

export const metadata = { title: "Working Hours" };

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export default async function HoursPage() {
  const { businessId } = await requireBusiness();

  await ensureDefaultHours(businessId);

  const hours = await db.businessHour.findMany({
    where: { businessId },
  });

  // Sort by day order and serialize
  const sorted: HourData[] = DAY_ORDER.map((day) => {
    const h = hours.find((x) => x.dayOfWeek === day);
    return {
      dayOfWeek: day,
      isOpen: h?.isOpen ?? false,
      openTime: h?.openTime ?? "09:00",
      closeTime: h?.closeTime ?? "18:00",
      slotIntervalMinutes: h?.slotIntervalMinutes ?? 30,
    };
  });

  return <HoursManager initialHours={sorted} />;
}
