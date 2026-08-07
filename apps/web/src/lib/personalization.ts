import { db } from "./db";

const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
const DECAY_DAYS = 90;
const MAX_AFFINITY_IDS = 5;

function isDecayed(date: Date): boolean {
  return Date.now() - date.getTime() > DECAY_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Recomputes category affinity scores for a user from favorites and
 * appointments, then stores the ranked ID list in UserPreferences.
 *
 * Signals and weights:
 *   Favorite → Business categories      2 pts (÷2 if >90 days old)
 *   Appointment COMPLETED → categories  4 pts (÷2 if >90 days old)
 *   Appointment PENDING/CONFIRMED       2 pts (÷2 if >90 days old)
 *
 * Throttled: skips if affinityComputedAt is less than 5 minutes old.
 */
export async function computeAndStoreUserAffinity(userId: string): Promise<void> {
  // Throttle guard
  const existing = await db.userPreferences.findUnique({
    where: { userId },
    select: { affinityComputedAt: true, personalizationConsentAt: true },
  });

  if (!existing?.personalizationConsentAt) return;

  if (
    existing.affinityComputedAt &&
    Date.now() - existing.affinityComputedAt.getTime() < THROTTLE_MS
  ) {
    return;
  }

  const categoryScores = new Map<string, number>();

  function addScore(map: Map<string, number>, key: string, base: number, date: Date) {
    const w = isDecayed(date) ? base / 2 : base;
    map.set(key, (map.get(key) ?? 0) + w);
  }

  // ── Favorite signals ────────────────────────────────────────────
  const favorites = await db.favorite.findMany({
    where: { userId },
    select: {
      createdAt: true,
      business: { select: { categories: { select: { categoryId: true } } } },
    },
  });

  for (const fav of favorites) {
    for (const bc of fav.business.categories) {
      addScore(categoryScores, bc.categoryId, 2, fav.createdAt);
    }
  }

  // ── Appointment signals ─────────────────────────────────────────
  const appointments = await db.appointment.findMany({
    where: {
      customerId: userId,
      status: { in: ["COMPLETED", "CONFIRMED", "PENDING"] },
    },
    select: {
      status: true,
      createdAt: true,
      business: { select: { categories: { select: { categoryId: true } } } },
    },
  });

  for (const appt of appointments) {
    const base = appt.status === "COMPLETED" ? 4 : 2;
    for (const bc of appt.business.categories) {
      addScore(categoryScores, bc.categoryId, base, appt.createdAt);
    }
  }

  // ── Sort and take top N ─────────────────────────────────────────
  const topCategories = [...categoryScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_AFFINITY_IDS)
    .map(([id]) => id);

  await db.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      preferredCategoryIds: topCategories,
      affinityComputedAt: new Date(),
    },
    update: {
      preferredCategoryIds: topCategories,
      affinityComputedAt: new Date(),
    },
  });
}
