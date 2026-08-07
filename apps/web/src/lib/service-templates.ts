import type { PriceType } from "@/generated/prisma/enums";

export type ServiceTemplateCategory =
  | "Saç"
  | "Sakal"
  | "Cilt"
  | "Tırnak"
  | "Makyaj"
  | "Kaş / Kirpik"
  | "Masaj / Spa"
  | "Estetik"
  | "Dövme / Piercing";

export type ServiceTemplatePackage =
  | "barber-basics"
  | "hair-salon-basics"
  | "beauty-salon-basics"
  | "skin-care-basics"
  | "spa-basics";

export interface ServiceTemplate {
  category: ServiceTemplateCategory;
  durationMinutes: number;
  description?: string;
  price?: number;
  priceType?: PriceType;
  tags?: string[];
  packageIds?: ServiceTemplatePackage[];
}

export const SERVICE_TEMPLATE_PACKAGES: Record<
  ServiceTemplatePackage,
  { label: string; description: string }
> = {
  "barber-basics": {
    label: "Berber başlangıç paketi",
    description: "Saç, sakal ve hızlı bakım hizmetleri",
  },
  "hair-salon-basics": {
    label: "Kuaför başlangıç paketi",
    description: "Kesim, boya, röfle ve fön hizmetleri",
  },
  "beauty-salon-basics": {
    label: "Güzellik salonu başlangıç paketi",
    description: "Cilt, tırnak, kaş ve kirpik hizmetleri",
  },
  "skin-care-basics": {
    label: "Cilt bakımı paketi",
    description: "Bakım, peeling ve danışma odaklı servisler",
  },
  "spa-basics": {
    label: "Spa ve masaj paketi",
    description: "Masaj ve rahatlama servisleri",
  },
};

export const SERVICE_TEMPLATES: Record<string, ServiceTemplate> = {
  "Saç Kesimi": {
    category: "Saç",
    durationMinutes: 45,
    description: "Kişiye uygun kesim ve şekillendirme",
    price: 350,
    priceType: "FIXED",
    tags: ["popüler"],
    packageIds: ["barber-basics", "hair-salon-basics"],
  },
  "Sakal Tıraşı": {
    category: "Sakal",
    durationMinutes: 30,
    description: "Sakal şekillendirme ve tıraş",
    price: 220,
    priceType: "FIXED",
    tags: ["hızlı"],
    packageIds: ["barber-basics"],
  },
  "Cilt Bakımı": {
    category: "Cilt",
    durationMinutes: 60,
    description: "Temel temizlik ve nemlendirme bakımı",
    price: 900,
    priceType: "STARTS_FROM",
    tags: ["popüler"],
    packageIds: ["barber-basics", "hair-salon-basics", "beauty-salon-basics"],
  },
  "Masaj": {
    category: "Masaj / Spa",
    durationMinutes: 60,
    description: "Rahatlatıcı klasik masaj",
    price: 900,
    priceType: "STARTS_FROM",
    packageIds: ["barber-basics", "spa-basics"],
  },
  "Saç Boyama": {
    category: "Saç",
    durationMinutes: 120,
    description: "Tek renk saç boyama",
    price: 1500,
    priceType: "STARTS_FROM",
    tags: ["renk"],
    packageIds: ["hair-salon-basics"],
  },
  "Saç Fırçalanması": {
    category: "Saç",
    durationMinutes: 60,
    description: "Fön ve şekillendirme",
    price: 450,
    priceType: "FIXED",
    packageIds: ["hair-salon-basics"],
  },
  "Röfle": {
    category: "Saç",
    durationMinutes: 90,
    description: "Işıltı ve renk geçiş uygulaması",
    price: 1800,
    priceType: "STARTS_FROM",
    packageIds: ["hair-salon-basics"],
  },
  "Manikür": {
    category: "Tırnak",
    durationMinutes: 45,
    description: "El ve tırnak bakımı",
    price: 400,
    priceType: "FIXED",
    packageIds: ["beauty-salon-basics"],
  },
  "Pedikür": {
    category: "Tırnak",
    durationMinutes: 60,
    description: "Ayak ve tırnak bakımı",
    price: 500,
    priceType: "FIXED",
    packageIds: ["beauty-salon-basics"],
  },
  "Jel Manikür": {
    category: "Tırnak",
    durationMinutes: 60,
    description: "Jel uygulamalı manikür",
    price: 650,
    priceType: "FIXED",
    packageIds: ["beauty-salon-basics"],
  },
  "Akrylik Tırnak": {
    category: "Tırnak",
    durationMinutes: 75,
    description: "Akrilik tırnak uygulaması",
    price: 950,
    priceType: "STARTS_FROM",
  },
  "Makyaj": {
    category: "Makyaj",
    durationMinutes: 60,
    description: "Günlük veya özel gün makyajı",
    price: 1200,
    priceType: "STARTS_FROM",
  },
  "Smokey Eyes": {
    category: "Makyaj",
    durationMinutes: 75,
    description: "Yoğun göz makyajı uygulaması",
    price: 1000,
    priceType: "FIXED",
  },
  "Bridal Makeup": {
    category: "Makyaj",
    durationMinutes: 90,
    description: "Gelin makyajı",
    price: 4500,
    priceType: "STARTS_FROM",
  },
  "Kaş Tasarımı": {
    category: "Kaş / Kirpik",
    durationMinutes: 30,
    description: "Kaş şekillendirme ve düzenleme",
    price: 300,
    priceType: "FIXED",
    packageIds: ["beauty-salon-basics"],
  },
  "Kaş Tinting": {
    category: "Kaş / Kirpik",
    durationMinutes: 20,
    description: "Kaş renklendirme",
    price: 350,
    priceType: "FIXED",
  },
  "Kirpik Lifti": {
    category: "Kaş / Kirpik",
    durationMinutes: 45,
    description: "Kirpik lifting uygulaması",
    price: 750,
    priceType: "FIXED",
    packageIds: ["beauty-salon-basics"],
  },
  "Kirpik Uzatma": {
    category: "Kaş / Kirpik",
    durationMinutes: 120,
    description: "İpek kirpik uygulaması",
    price: 1400,
    priceType: "STARTS_FROM",
  },
  "Dudak Kontürü": {
    category: "Makyaj",
    durationMinutes: 30,
    description: "Dudak kontür ve renklendirme",
    price: 1800,
    priceType: "STARTS_FROM",
  },
  "İpek Cilt Peeling": {
    category: "Cilt",
    durationMinutes: 45,
    description: "Nazik peeling ve cilt yenileme",
    price: 850,
    priceType: "FIXED",
    packageIds: ["skin-care-basics"],
  },
  "HydraFacial": {
    category: "Cilt",
    durationMinutes: 60,
    description: "HydraFacial cilt bakımı",
    price: 1600,
    priceType: "STARTS_FROM",
    packageIds: ["skin-care-basics"],
  },
  "Temizleme Fasiyal": {
    category: "Cilt",
    durationMinutes: 45,
    description: "Klasik cilt temizleme",
    price: 750,
    priceType: "FIXED",
    packageIds: ["skin-care-basics"],
  },
  "Botoks": {
    category: "Estetik",
    durationMinutes: 20,
    description: "Botoks uygulaması",
    price: 2500,
    priceType: "STARTS_FROM",
  },
  "Dolgu": {
    category: "Estetik",
    durationMinutes: 30,
    description: "Dolgu uygulaması",
    price: 3000,
    priceType: "STARTS_FROM",
  },
  "Lazer Epilasyon": {
    category: "Cilt",
    durationMinutes: 45,
    description: "Bölgesel lazer epilasyon",
    price: 900,
    priceType: "STARTS_FROM",
    packageIds: ["skin-care-basics"],
  },
  "Cilt Bakım Paketi": {
    category: "Cilt",
    durationMinutes: 90,
    description: "Kapsamlı cilt bakım paketi",
    price: 1800,
    priceType: "STARTS_FROM",
    packageIds: ["skin-care-basics", "beauty-salon-basics"],
  },
  "Spa Paketi": {
    category: "Masaj / Spa",
    durationMinutes: 120,
    description: "Masaj ve bakım paketi",
    price: 2200,
    priceType: "STARTS_FROM",
    packageIds: ["spa-basics"],
  },
  "Vücut Masajı": {
    category: "Masaj / Spa",
    durationMinutes: 60,
    description: "Tüm vücut masajı",
    price: 1000,
    priceType: "FIXED",
    packageIds: ["spa-basics"],
  },
  "Çift Masaj": {
    category: "Masaj / Spa",
    durationMinutes: 90,
    description: "İki kişi için masaj deneyimi",
    price: 2400,
    priceType: "FIXED",
    packageIds: ["spa-basics"],
  },
  "Thai Masajı": {
    category: "Masaj / Spa",
    durationMinutes: 90,
    description: "Thai masaj uygulaması",
    price: 1500,
    priceType: "FIXED",
    packageIds: ["spa-basics"],
  },
  "Dövme": {
    category: "Dövme / Piercing",
    durationMinutes: 120,
    description: "Tasarım ve uygulama için ön görüşme gerekir",
    priceType: "CONSULTATION_REQUIRED",
  },
  "Piercing": {
    category: "Dövme / Piercing",
    durationMinutes: 30,
    description: "Piercing uygulaması",
    price: 700,
    priceType: "FIXED",
  },
  "Estetik Danışması": {
    category: "Estetik",
    durationMinutes: 30,
    description: "Uygun işlem planı için ücretsiz görüşme",
    priceType: "FREE_CONSULTATION",
  },
  "Post-Op Kontrolü": {
    category: "Estetik",
    durationMinutes: 30,
    description: "İşlem sonrası kontrol randevusu",
    price: 500,
    priceType: "FIXED",
  },
};

export const CATEGORY_SERVICE_TEMPLATES: Record<string, string[]> = {
  "barber-shop": ["Saç Kesimi", "Sakal Tıraşı", "Cilt Bakımı", "Masaj"],
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
    "Dudak Kontürü",
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
    "Dudak Kontürü",
  ],
  "tattoo-piercing": ["Dövme", "Piercing"],
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
