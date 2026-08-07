/**
 * Maps known seeded category slugs to Turkish display names.
 * Slugs and URLs are never changed — only visible UI labels.
 */
const CATEGORY_TR: Record<string, string> = {
  "hair-salon":        "Kuaför",
  "barber-shop":       "Berber",
  "nail-salon":        "Tırnak Stüdyosu",
  "eyebrow-lash":      "Kaş & Kirpik",
  "skin-care":         "Cilt Bakımı",
  "hair-removal":      "Epilasyon",
  "spa-massage":       "Masaj & Spa",
  "tattoo-piercing":   "Dövme & Piercing",
  "permanent-makeup":  "Kalıcı Makyaj",
  "makeup-artist":     "Makyaj",
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
