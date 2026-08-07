import type { Locale } from "@/lib/i18n-config";

export type HomeDiscoveryCopy = {
  rebook: string;
  recentlyViewed: string;
  recommended: string;
  newOnUrGlowUp: string;
  popular: string;
  seeAll: string;
};

const copy: Record<Locale, HomeDiscoveryCopy> = {
  tr: {
    rebook: "Yeniden rezervasyon yapın",
    recentlyViewed: "Son görüntülenenler",
    recommended: "Önerilen",
    newOnUrGlowUp: "UrGlowUp'ta yeni",
    popular: "Popüler",
    seeAll: "Tümünü gör",
  },
  en: {
    rebook: "Book again",
    recentlyViewed: "Recently viewed",
    recommended: "Recommended",
    newOnUrGlowUp: "New on UrGlowUp",
    popular: "Popular",
    seeAll: "See all",
  },
  de: {
    rebook: "Erneut buchen",
    recentlyViewed: "Zuletzt angesehen",
    recommended: "Empfohlen",
    newOnUrGlowUp: "Neu bei UrGlowUp",
    popular: "Beliebt",
    seeAll: "Alle ansehen",
  },
  ru: {
    rebook: "Записаться снова",
    recentlyViewed: "Недавно просмотренные",
    recommended: "Рекомендуем",
    newOnUrGlowUp: "Новое на UrGlowUp",
    popular: "Популярное",
    seeAll: "Посмотреть все",
  },
  es: {
    rebook: "Reservar de nuevo",
    recentlyViewed: "Vistos recientemente",
    recommended: "Recomendados",
    newOnUrGlowUp: "Novedades en UrGlowUp",
    popular: "Populares",
    seeAll: "Ver todo",
  },
  bg: {
    rebook: "Резервирайте отново",
    recentlyViewed: "Последно разгледани",
    recommended: "Препоръчани",
    newOnUrGlowUp: "Ново в UrGlowUp",
    popular: "Популярни",
    seeAll: "Вижте всички",
  },
  fa: {
    rebook: "رزرو دوباره",
    recentlyViewed: "بازدیدهای اخیر",
    recommended: "پیشنهادشده",
    newOnUrGlowUp: "جدید در UrGlowUp",
    popular: "محبوب",
    seeAll: "مشاهده همه",
  },
  pl: {
    rebook: "Zarezerwuj ponownie",
    recentlyViewed: "Ostatnio oglądane",
    recommended: "Polecane",
    newOnUrGlowUp: "Nowości w UrGlowUp",
    popular: "Popularne",
    seeAll: "Zobacz wszystkie",
  },
  ar: {
    rebook: "احجز مرة أخرى",
    recentlyViewed: "شوهدت مؤخراً",
    recommended: "موصى به",
    newOnUrGlowUp: "جديد على UrGlowUp",
    popular: "الأكثر رواجاً",
    seeAll: "عرض الكل",
  },
  fr: {
    rebook: "Réserver à nouveau",
    recentlyViewed: "Consultés récemment",
    recommended: "Recommandés",
    newOnUrGlowUp: "Nouveautés sur UrGlowUp",
    popular: "Populaires",
    seeAll: "Tout voir",
  },
  nl: {
    rebook: "Opnieuw boeken",
    recentlyViewed: "Onlangs bekeken",
    recommended: "Aanbevolen",
    newOnUrGlowUp: "Nieuw op UrGlowUp",
    popular: "Populair",
    seeAll: "Alles bekijken",
  },
  ro: {
    rebook: "Rezervă din nou",
    recentlyViewed: "Vizualizate recent",
    recommended: "Recomandate",
    newOnUrGlowUp: "Nou pe UrGlowUp",
    popular: "Populare",
    seeAll: "Vezi toate",
  },
};

export function getHomeDiscoveryCopy(locale: Locale): HomeDiscoveryCopy {
  return copy[locale] ?? copy.tr;
}
