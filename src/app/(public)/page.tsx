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
import { HomeHowItWorks } from "@/components/home/home-how-it-works";
import { HomeVerifiedCallout } from "@/components/home/home-verified-callout";
import { HomeBusinessCTA } from "@/components/home/home-business-cta";
import { HomeSearchPanel } from "@/components/home/home-search-panel";
import { buildAlternates } from "@/lib/i18n-metadata";

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
            exploreHref="/explore"
            labels={{
              searchPlaceholder: "Uzman, hizmet veya işletme ara",
              regionPlaceholder: "Bölge veya ilçe seç",
              categoryPlaceholder: "Kategori seç",
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

      {featuredBusinesses.length > 0 && (
        <section className="bg-background px-4 py-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-end gap-4">
              <Link
                href="/explore"
                className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Tüm uzmanları gör →
              </Link>
            </div>
            <div className={cn(featuredBusinesses.length === 1 && "max-w-sm")}>
              <BusinessGrid businesses={featuredBusinesses} />
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
