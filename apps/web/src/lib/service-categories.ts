export const SERVICE_CATEGORY_OPTIONS = [
  "Saç",
  "Sakal",
  "Cilt",
  "Tırnak",
  "Makyaj",
  "Kaş / Kirpik",
  "Masaj / Spa",
  "Estetik",
  "Dövme / Piercing",
  "Diğer",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORY_OPTIONS)[number];

export const DEFAULT_SERVICE_CATEGORY: ServiceCategory = "Diğer";

export function normalizeServiceCategory(category?: string | null): ServiceCategory {
  const match = SERVICE_CATEGORY_OPTIONS.find((option) => option === category);
  return match ?? DEFAULT_SERVICE_CATEGORY;
}
