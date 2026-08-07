import type { Locale } from "@/lib/i18n-config";

export interface HomeSearchCopy {
  title: string;
  description: string;
  searchPlaceholder: string;
  regionPlaceholder: string;
  categoryPlaceholder: string;
  datePlaceholder: string;
  submit: string;
  popularSearches: string;
  popularServicesTitle: string;
  hair: string;
  nails: string;
  skinCare: string;
  tattoo: string;
}

export const homeSearchCopy: Record<Locale, HomeSearchCopy> = {
  tr: {
    title: "Yakınındaki güzellik uzmanlarını keşfet",
    description:
      "Sana uygun hizmeti, konumu ve uzmanı seç. Gerçek işleri gör, doğrulanmış yorumlarla güvenle randevu al.",
    searchPlaceholder: "Uzman, hizmet veya işletme ara",
    regionPlaceholder: "Bölge veya ilçe seç",
    categoryPlaceholder: "Kategori seç",
    datePlaceholder: "Tarih ve saat seç",
    submit: "Ara",
    popularSearches: "Popüler aramalar:",
    popularServicesTitle: "Popüler hizmetler",
    hair: "Kuaför",
    nails: "Tırnak",
    skinCare: "Cilt bakımı",
    tattoo: "Dövme & Piercing",
  },
  en: {
    title: "Discover beauty professionals near you",
    description:
      "Choose the right service, location, and professional. See real work, read verified reviews, and book with confidence.",
    searchPlaceholder: "Search professional, service, or business",
    regionPlaceholder: "Choose area or district",
    categoryPlaceholder: "Choose category",
    datePlaceholder: "Choose date and time",
    submit: "Search",
    popularSearches: "Popular searches:",
    popularServicesTitle: "Popular services",
    hair: "Hair salon",
    nails: "Nails",
    skinCare: "Skin care",
    tattoo: "Tattoo & Piercing",
  },
  de: {
    title: "Entdecke Beauty-Profis in deiner Nähe",
    description:
      "Wähle Service, Ort und Profi. Sieh echte Arbeiten, lies verifizierte Bewertungen und buche mit Vertrauen.",
    searchPlaceholder: "Profi, Service oder Unternehmen suchen",
    regionPlaceholder: "Region oder Bezirk wählen",
    categoryPlaceholder: "Kategorie wählen",
    datePlaceholder: "Datum und Uhrzeit wählen",
    submit: "Suchen",
    popularSearches: "Beliebte Suchen:",
    popularServicesTitle: "Beliebte Services",
    hair: "Friseur",
    nails: "Nägel",
    skinCare: "Hautpflege",
    tattoo: "Tattoo & Piercing",
  },
  ru: {
    title: "Найдите бьюти-специалистов рядом",
    description:
      "Выберите услугу, район и специалиста. Смотрите реальные работы, читайте проверенные отзывы и бронируйте уверенно.",
    searchPlaceholder: "Специалист, услуга или бизнес",
    regionPlaceholder: "Выберите район",
    categoryPlaceholder: "Выберите категорию",
    datePlaceholder: "Выберите дату и время",
    submit: "Поиск",
    popularSearches: "Популярные запросы:",
    popularServicesTitle: "Популярные услуги",
    hair: "Парикмахер",
    nails: "Ногти",
    skinCare: "Уход за кожей",
    tattoo: "Тату & Пирсинг",
  },
  es: {
    title: "Descubre profesionales de belleza cerca de ti",
    description:
      "Elige el servicio, la zona y el profesional. Mira trabajos reales, lee reseñas verificadas y reserva con confianza.",
    searchPlaceholder: "Buscar profesional, servicio o negocio",
    regionPlaceholder: "Elegir zona o distrito",
    categoryPlaceholder: "Elegir categoría",
    datePlaceholder: "Elegir fecha y hora",
    submit: "Buscar",
    popularSearches: "Búsquedas populares:",
    popularServicesTitle: "Servicios populares",
    hair: "Peluquería",
    nails: "Uñas",
    skinCare: "Cuidado facial",
    tattoo: "Tatuaje & Piercing",
  },
  bg: {
    title: "Открий бюти специалисти близо до теб",
    description:
      "Избери услуга, район и специалист. Виж реални работи, прочети проверени отзиви и резервирай уверено.",
    searchPlaceholder: "Търси специалист, услуга или бизнес",
    regionPlaceholder: "Избери район",
    categoryPlaceholder: "Избери категория",
    datePlaceholder: "Изберете дата и час",
    submit: "Търси",
    popularSearches: "Популярни търсения:",
    popularServicesTitle: "Популярни услуги",
    hair: "Фризьор",
    nails: "Маникюр",
    skinCare: "Грижа за кожа",
    tattoo: "Татуировки & Пиърсинг",
  },
  fa: {
    title: "متخصصین زیبایی نزدیک خود را کاوش کنید",
    description:
      "خدمت، منطقه و متخصص مناسب را انتخاب کنید. کارهای واقعی را ببینید، نظرات تایید‌شده را بخوانید، و با اطمینان نوبت بگیرید.",
    searchPlaceholder: "جستجوی متخصص، خدمت یا کسب‌وکار",
    regionPlaceholder: "منطقه یا ناحیه را انتخاب کنید",
    categoryPlaceholder: "دسته‌بندی را انتخاب کنید",
    datePlaceholder: "تاریخ و ساعت را انتخاب کنید",
    submit: "جستجو",
    popularSearches: "جستجوهای محبوب:",
    popularServicesTitle: "خدمات محبوب",
    hair: "آرایشگر",
    nails: "ناخن",
    skinCare: "مراقبت پوست",
    tattoo: "تاتو و پیرسینگ",
  },
  pl: {
    title: "Odkryj specjalistów urody w pobliżu",
    description:
      "Wybierz odpowiednią usługę, lokalizację i specjalistę. Patrz na rzeczywiste prace, przeczytaj zweryfikowane opinie i zarezerwuj z pewnością.",
    searchPlaceholder: "Szukaj specjalisty, usługi lub biznesu",
    regionPlaceholder: "Wybierz region lub dzielnicę",
    categoryPlaceholder: "Wybierz kategorię",
    datePlaceholder: "Wybierz datę i godzinę",
    submit: "Szukaj",
    popularSearches: "Popularne wyszukiwania:",
    popularServicesTitle: "Popularne usługi",
    hair: "Fryzjer",
    nails: "Paznokcie",
    skinCare: "Pielęgnacja skóry",
    tattoo: "Tatuaż & Piercing",
  },
  ar: {
    title: "اكتشف متخصصي الجمال بالقرب منك",
    description:
      "اختر الخدمة والموقع والمتخصص المناسب. شاهد أعمالاً حقيقية واقرأ التقييمات المتحققة واحجز بثقة.",
    searchPlaceholder: "ابحث عن متخصص أو خدمة أو عمل",
    regionPlaceholder: "اختر المنطقة أو الحي",
    categoryPlaceholder: "اختر الفئة",
    datePlaceholder: "اختر التاريخ والوقت",
    submit: "بحث",
    popularSearches: "عمليات البحث الشهيرة:",
    popularServicesTitle: "الخدمات الشهيرة",
    hair: "صالون الشعر",
    nails: "الأظافر",
    skinCare: "العناية بالبشرة",
    tattoo: "الوشم والثقب",
  },
  fr: {
    title: "Découvrez les spécialistes de la beauté près de vous",
    description:
      "Choisissez le service, l'emplacement et le spécialiste appropriés. Consultez les vrais travaux, lisez les avis vérifiés et réservez en toute confiance.",
    searchPlaceholder: "Rechercher un spécialiste, un service ou une entreprise",
    regionPlaceholder: "Choisir région ou arrondissement",
    categoryPlaceholder: "Choisir une catégorie",
    datePlaceholder: "Choisir date et heure",
    submit: "Rechercher",
    popularSearches: "Recherches populaires:",
    popularServicesTitle: "Services populaires",
    hair: "Salon de coiffure",
    nails: "Ongles",
    skinCare: "Soins de la peau",
    tattoo: "Tatouage & Piercing",
  },
  nl: {
    title: "Ontdek schoonheidsspecialisten in de buurt",
    description:
      "Kies de juiste service, locatie en specialist. Bekijk echt werk, lees geverifieerde beoordelingen en boek met vertrouwen.",
    searchPlaceholder: "Zoeken naar specialist, service of bedrijf",
    regionPlaceholder: "Kies regio of wijk",
    categoryPlaceholder: "Kies categorie",
    datePlaceholder: "Kies datum en tijd",
    submit: "Zoeken",
    popularSearches: "Populaire zoekopdrachten:",
    popularServicesTitle: "Populaire services",
    hair: "Kapsalon",
    nails: "Nagels",
    skinCare: "Huidverzorging",
    tattoo: "Tattoo & Piercing",
  },
  ro: {
    title: "Descoperi specialiști în frumusețe aproape de tine",
    description:
      "Alege serviciul, locația și specialistul potrivit. Vezi lucrări reale, citește recenzii verificate și rezervă cu încredere.",
    searchPlaceholder: "Cauta specialist, serviciu sau afacere",
    regionPlaceholder: "Alege regiune sau district",
    categoryPlaceholder: "Alege categorie",
    datePlaceholder: "Alege data și ora",
    submit: "Cauta",
    popularSearches: "Căutări populare:",
    popularServicesTitle: "Servicii populare",
    hair: "Coafor",
    nails: "Unghii",
    skinCare: "Îngrijirea pielii",
    tattoo: "Tatuaj & Piercing",
  },
};

export function getHomeSearchCopy(locale: Locale): HomeSearchCopy {
  return homeSearchCopy[locale] ?? homeSearchCopy.tr;
}
