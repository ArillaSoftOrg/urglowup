import type { PriceType } from "@/generated/prisma/enums";

export interface ServiceTemplate {
  durationMinutes: number;
  description?: string;
  priceType?: PriceType;
}

export const SERVICE_TEMPLATES: Record<string, ServiceTemplate> = {
  "Saç Kesimi": { durationMinutes: 45, priceType: "FIXED" },
  "Sakal Tıraşı": { durationMinutes: 30, priceType: "FIXED" },
  "Cilt Bakımı": { durationMinutes: 60, priceType: "FIXED" },
  "Masaj": { durationMinutes: 60, priceType: "FIXED" },
  "Saç Boyama": { durationMinutes: 120, priceType: "FIXED" },
  "Saç Fırçalanması": { durationMinutes: 60, priceType: "FIXED" },
  "Röfle": { durationMinutes: 90, priceType: "FIXED" },
  "Manikür": { durationMinutes: 45, priceType: "FIXED" },
  "Pedikür": { durationMinutes: 60, priceType: "FIXED" },
  "Jel Manikür": { durationMinutes: 60, priceType: "FIXED" },
  "Akrylik Tırnak": { durationMinutes: 75, priceType: "FIXED" },
  "Makyaj": { durationMinutes: 60, priceType: "FIXED" },
  "Smokey Eyes": { durationMinutes: 75, priceType: "FIXED" },
  "Bridal Makeup": { durationMinutes: 90, priceType: "FIXED" },
  "Kaş Tasarımı": { durationMinutes: 30, priceType: "FIXED" },
  "Kaş Tinting": { durationMinutes: 20, priceType: "FIXED" },
  "Kirpik Lifti": { durationMinutes: 45, priceType: "FIXED" },
  "Kirpik Uzatma": { durationMinutes: 120, priceType: "FIXED" },
  "Dudak Kontörü": { durationMinutes: 30, priceType: "FIXED" },
  "İpek Cilt Peeling": { durationMinutes: 45, priceType: "FIXED" },
  "HydraFacial": { durationMinutes: 60, priceType: "FIXED" },
  "Temizleme Fasiyal": { durationMinutes: 45, priceType: "FIXED" },
  "Botoks": { durationMinutes: 20, priceType: "FIXED" },
  "Dolgu": { durationMinutes: 30, priceType: "FIXED" },
  "Lazer Epilasyon": { durationMinutes: 45, priceType: "FIXED" },
  "Cilt Bakım Paketi": { durationMinutes: 90, priceType: "FIXED" },
  "Spa Paketi": { durationMinutes: 120, priceType: "FIXED" },
  "Vücut Masajı": { durationMinutes: 60, priceType: "FIXED" },
  "Çift Masaj": { durationMinutes: 90, priceType: "FIXED" },
  "Thai Masajı": { durationMinutes: 90, priceType: "FIXED" },
  "Dövme": { durationMinutes: 120, priceType: "CONSULTATION_REQUIRED" },
  "Piercing": { durationMinutes: 30, priceType: "FIXED" },
  "Estetik Danışması": { durationMinutes: 30, priceType: "FREE_CONSULTATION" },
  "Post-Op Kontrolü": { durationMinutes: 30, priceType: "FIXED" },
};

export const CATEGORY_SERVICE_TEMPLATES: Record<string, string[]> = {
  "barber-shop": [
    "Saç Kesimi",
    "Sakal Tıraşı",
    "Cilt Bakımı",
    "Masaj",
  ],
  "hair-salon": [
    "Saç Kesimi",
    "Saç Boyama",
    "Saç Fırçalanması",
    "Röfle",
    "Cilt Bakımı",
    "Sakal Tıraşı",
  ],
  "nail-salon": [
    "Manikür",
    "Pedikür",
    "Jel Manikür",
    "Akrylik Tırnak",
    "Kaş Tasarımı",
  ],
  "skin-care": [
    "Temizleme Fasiyal",
    "İpek Cilt Peeling",
    "HydraFacial",
    "Cilt Bakım Paketi",
    "Botoks",
    "Dolgu",
    "Lazer Epilasyon",
  ],
  "makeup-artist": [
    "Makyaj",
    "Smokey Eyes",
    "Bridal Makeup",
    "Dudak Kontörü",
    "Kaş Tasarımı",
  ],
  "spa-massage": [
    "Vücut Masajı",
    "Thai Masajı",
    "Çift Masaj",
    "Spa Paketi",
    "Cilt Bakımı",
    "Masaj",
  ],
  "eyebrow-lash": [
    "Kaş Tasarımı",
    "Kaş Tinting",
    "Kirpik Lifti",
    "Kirpik Uzatma",
    "Dudak Kontörü",
  ],
  "tattoo-piercing": [
    "Dövme",
    "Piercing",
  ],
  "aesthetic-clinic": [
    "Estetik Danışması",
    "Botoks",
    "Dolgu",
    "Lazer Epilasyon",
    "HydraFacial",
    "Post-Op Kontrolü",
  ],
};

export function getServiceTemplatesForCategories(
  slugs: string[]
): Array<{ name: string } & ServiceTemplate> {
  const templateNames = new Set<string>();

  for (const slug of slugs) {
    const names = CATEGORY_SERVICE_TEMPLATES[slug];
    if (names) {
      names.forEach((name) => templateNames.add(name));
    }
  }

  const templates = Array.from(templateNames)
    .filter((name) => name in SERVICE_TEMPLATES)
    .map((name) => ({
      name,
      ...SERVICE_TEMPLATES[name],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  return templates;
}
