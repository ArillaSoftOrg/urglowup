import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getHomePersonalization,
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  getMarketplaceCities,
} from "@/lib/queries/marketplace";
import { CategoryCard } from "@/components/marketplace/category-card";
import { HomeDiscoverySections } from "@/components/home/home-discovery-sections";
import { HomeHowItWorks } from "@/components/home/home-how-it-works";
import { HomeVerifiedCallout } from "@/components/home/home-verified-callout";
import { HomeSearchPanel } from "@/components/home/home-search-panel";
import { HomeTestimonialsMarquee } from "@/components/home/home-testimonials-marquee";
import { buildAlternates } from "@/lib/i18n-metadata";
import { getCurrentUser } from "@/lib/auth";
import { getHomeDiscoveryCopy } from "@/lib/home-discovery-copy";
import {
  RECENT_BUSINESSES_COOKIE_KEY,
  parseRecentBusinessIds,
} from "@/lib/recent-business-history";

export const metadata: Metadata = {
  title: { absolute: "UrGlowUp | Güzellik uzmanlarını keşfet ve randevu al" },
  description:
    "Yakınındaki güzellik salonlarını, kuaförleri, tırnak ve cilt bakımı uzmanlarını keşfet; gerçek işleri ve yorumları inceleyip güvenle randevu al.",
  openGraph: {
    title: "UrGlowUp | Güzellik uzmanlarını keşfet ve randevu al",
    description:
      "Yakınındaki güzellik salonlarını, kuaförleri, tırnak ve cilt bakımı uzmanlarını keşfet; gerçek işleri ve yorumları inceleyip güvenle randevu al.",
    url: "/",
    locale: "tr_TR",
  },
  alternates: buildAlternates("/", "tr"),
};

export default async function HomePage() {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const [categories, businesses, cities, personalization] = await Promise.all([
    getMarketplaceCategories(),
    getMarketplaceBusinesses(),
    getMarketplaceCities(),
    user ? getHomePersonalization(user.id) : null,
  ]);

  const activeCategories = categories.filter((c) => c.businessCount > 0);
  const featuredBusinesses = businesses.slice(0, 6);
  const discoveryCopy = getHomeDiscoveryCopy("tr");
  const recentBusinessIds = parseRecentBusinessIds(
    cookieStore.get(RECENT_BUSINESSES_COOKIE_KEY)?.value,
  );

  return (
    <div className="flex flex-col">
      <section className="bg-background px-4 py-12 md:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Güzellik &amp; Kişisel Bakım
          </p>
          <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-[1.04] tracking-[-0.025em] md:text-6xl">
            Yakınındaki güzellik uzmanlarını keşfet
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Sana uygun hizmeti, konumu ve uzmanı seç. Gerçek işleri gör,
            doğrulanmış yorumlarla güvenle randevu al.
          </p>
          <HomeSearchPanel
            categories={activeCategories.map((category) => ({
              name: category.name,
              slug: category.slug,
            }))}
            cities={cities}
            businesses={featuredBusinesses.map((business) => ({
              name: business.name,
              slug: business.slug,
              city: business.city,
              district: business.district,
              categoryName: business.categories[0]?.category.name,
            }))}
            exploreHref="/explore"
            labels={{
              searchPlaceholder: "Uzman, hizmet veya işletme ara",
              regionPlaceholder: "Bölge veya ilçe seç",
              categoryPlaceholder: "Kategori seç",
              datePlaceholder: "Tarih ve saat seç",
              submit: "Ara",
            }}
          />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Popüler aramalar:</span>
            <Link href="/explore?category=hair-salon" className="hover:text-foreground">
              Kuaför
            </Link>
            <span>·</span>
            <Link href="/explore?category=nail-salon" className="hover:text-foreground">
              Tırnak
            </Link>
            <span>·</span>
            <Link href="/explore?category=skin-care" className="hover:text-foreground">
              Cilt bakımı
            </Link>
            <span>·</span>
            <Link href="/explore?category=tattoo-piercing" className="hover:text-foreground">
              Dövme &amp; Piercing
            </Link>
          </div>
        </div>
      </section>

      {activeCategories.length > 0 && (
        <section className="bg-surface-pink px-4 py-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Kategoriler
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
                  Popüler hizmetler
                </h2>
              </div>
              <Link
                href="/explore"
                className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Tümünü keşfet →
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
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      <HomeDiscoverySections
        businesses={businesses}
        copy={discoveryCopy}
        exploreHref="/explore"
        personalization={personalization}
        recentBusinessIds={recentBusinessIds}
      />

      <HomeHowItWorks />
      <HomeVerifiedCallout />
      <HomeTestimonialsMarquee />
    </div>
  );
}
