import { db } from "@/lib/db";

const HOLIDAY_API_BASE = "https://date.nager.at/api/v3/PublicHolidays";

interface NagerHoliday {
  date: string; // "YYYY-MM-DD"
  localName: string;
  name: string;
}

export async function syncTRHolidays(
  year: number
): Promise<{ synced: number; errors: number }> {
  const url = `${HOLIDAY_API_BASE}/${year}/TR`;
  let holidays: NagerHoliday[];

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    holidays = await res.json();
  } catch (err) {
    console.error(`[holidays] fetch failed for ${year}:`, err);
    return { synced: 0, errors: 1 };
  }

  let synced = 0;
  let errors = 0;

  for (const h of holidays) {
    try {
      await db.publicHoliday.upsert({
        where: { country_date: { country: "TR", date: new Date(h.date) } },
        create: {
          country: "TR",
          date: new Date(h.date),
          name: h.localName || h.name,
          year,
        },
        update: { name: h.localName || h.name },
      });
      synced++;
    } catch (err) {
      console.error(`[holidays] upsert failed for ${h.date}:`, err);
      errors++;
    }
  }

  return { synced, errors };
}

export async function getHolidaysForYear(year: number) {
  return db.publicHoliday.findMany({
    where: { country: "TR", year },
    orderBy: { date: "asc" },
  });
}
