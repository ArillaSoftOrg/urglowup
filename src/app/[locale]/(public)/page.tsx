import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  getMarketplaceCities,
} from "@/lib/queries/marketplace";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { CategoryCard } from "@/components/marketplace/category-card";
import { HomeTrustBar } from "@/components/home/home-trust-bar";
import { HomeHowItWorks } from "@/components/home/home-how-it-works";
import { HomeVerifiedCallout } from "@/components/home/home-verified-callout";
import { HomeBusinessCTA } from "@/components/home/home-business-cta";
import { HomeSearchPanel } from "@/components/home/home-search-panel";
import { getDictionary } from "@/lib/get-dictionary";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import type { Locale } from "@/lib/i18n-config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const homeSearchCopy: Record<
  Locale,
  {
    title: string;
    description: string;
    searchPlaceholder: string;
    regionPlaceholder: string;
    categoryPlaceholder: string;
    submit: string;
    popularSearches: string;
    popularServicesTitle: string;
    hair: string;
    nails: string;
    skinCare: string;
    tattoo: string;
  }
> = {
  tr: {
    title: "Yakınındaki güzellik uzmanlarını keşfet",
    description:
      "Sana uygun hizmeti, konumu ve uzmanı seç. Gerçek işleri gör, doğrulanmış yorumlarla güvenle randevu al.",
    searchPlaceholder: "Uzman, hizmet veya işletme ara",
    regionPlaceholder: "Bölge veya ilçe seç",
    categoryPlaceholder: "Kategori seç",
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
    submit: "Търси",
    popularSearches: "Популярни търсения:",
    popularServicesTitle: "Популярни услуги",
    hair: "Фризьор",
    nails: "Маникюр",
    skinCare: "Грижа за кожа",
    tattoo: "Татуировки & Пиърсинг",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = homeSearchCopy[locale as Locale] ?? homeSearchCopy.tr;
  const alternates = buildAlternates("/", locale);

  return {
    title: { absolute: "UrGlowUp" },
    description: copy.description,
    openGraph: {
      title: "UrGlowUp",
      description: copy.description,
      url: `/${locale}`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;
  const currentLocale = locale as Locale;
  const dict = await getDictionary(currentLocale);
  const copy = homeSearchCopy[currentLocale] ?? homeSearchCopy.tr;
  const p = (path: string) => `/${locale}${path}`;

  const [categories, businesses, cities] = await Promise.all([
    getMarketplaceCategories(),
    getMarketplaceBusinesses(),
    getMarketplaceCities(),
  ]);

  const activeCategories = categories.filter((c) => c.businessCount > 0);
  const featuredBusinesses = businesses.slice(0, 6);

  return (
    <div className="flex flex-col">
      <section className="bg-background px-4 py-12 md:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {dict.home.badge}
          </p>
          <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-[1.04] tracking-[-0.025em] md:text-6xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {copy.description}
          </p>
          <HomeSearchPanel
            categories={activeCategories.map((category) => ({
              name: category.name,
              slug: category.slug,
            }))}
            cities={cities}
            exploreHref={p("/explore")}
            labels={{
              searchPlaceholder: copy.searchPlaceholder,
              regionPlaceholder: copy.regionPlaceholder,
              categoryPlaceholder: copy.categoryPlaceholder,
              submit: copy.submit,
            }}
          />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {copy.popularSearches}
            </span>
            <Link href={`${p("/explore")}?category=hair-salon`} className="hover:text-foreground">
              {copy.hair}
            </Link>
            <span>·</span>
            <Link href={`${p("/explore")}?category=nail-salon`} className="hover:text-foreground">
              {copy.nails}
            </Link>
            <span>·</span>
            <Link href={`${p("/explore")}?category=skin-care`} className="hover:text-foreground">
              {copy.skinCare}
            </Link>
            <span>·</span>
            <Link href={`${p("/explore")}?category=tattoo-piercing`} className="hover:text-foreground">
              {copy.tattoo}
            </Link>
          </div>
        </div>
      </section>

      <HomeTrustBar />

      {activeCategories.length > 0 && (
        <section className="bg-surface-pink px-4 py-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {dict.home.categoriesLabel}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
                  {copy.popularServicesTitle}
                </h2>
              </div>
              <Link
                href={p("/explore")}
                className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {dict.home.categoriesSeeAll}
              </Link>
            </div>
            <div
              className={cn(
                "grid gap-3 md:gap-4",
                activeCategories.length === 1
                  ? "max-w-[10rem] grid-cols-1"
                  : activeCategories.length === 2
                    ? "max-w-xs grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              )}
            >
              {activeCategories.slice(0, 10).map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  locale={currentLocale}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredBusinesses.length > 0 && (
        <section className="bg-background px-4 py-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {dict.home.featuredLabel}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
                  {dict.home.featuredTitle}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {dict.home.featuredDescription}
                </p>
              </div>
              <Link
                href={p("/explore")}
                className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {dict.home.featuredSeeAll}
              </Link>
            </div>
            <div className={cn(featuredBusinesses.length === 1 && "max-w-sm")}>
              <BusinessGrid businesses={featuredBusinesses} locale={currentLocale} />
            </div>
          </div>
        </section>
      )}

      <HomeHowItWorks />
      <HomeVerifiedCallout />
      <HomeBusinessCTA />
    </div>
  );
}
