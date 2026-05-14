/**
 * Maps known seeded category slugs to Turkish display names.
 * Slugs and URLs are never changed — only visible UI labels.
 */
const CATEGORY_TR: Record<string, string> = {
  "hair-salon":        "Kuaför",
  "barber-shop":       "Berber Dükkanı",
  "nail-salon":        "Tırnak Stüdyosu",
  "skin-care":         "Cilt Bakımı",
  "makeup-artist":     "Makyaj Sanatçısı",
  "spa-massage":       "Spa & Masaj",
  "eyebrow-lash":      "Kaş & Kirpik",
  "tattoo-piercing":   "Dövme & Piercing",
  "aesthetic-clinic":  "Estetik Klinik",
  "other":             "Diğer",
};

/**
 * Returns the Turkish display name for a category slug,
 * falling back to the provided name (e.g. from the database).
 */
export function getCategoryLabel(slug: string, fallback: string): string {
  return CATEGORY_TR[slug] ?? fallback;
}
