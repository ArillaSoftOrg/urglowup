import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
} from "@/lib/queries/marketplace";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { CategoryCard } from "@/components/marketplace/category-card";
import { HomeTrustBar } from "@/components/home/home-trust-bar";
import { HomeHowItWorks } from "@/components/home/home-how-it-works";
import { HomeVerifiedCallout } from "@/components/home/home-verified-callout";
import { HomeBusinessCTA } from "@/components/home/home-business-cta";
import { getDictionary } from "@/lib/get-dictionary";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import type { Locale } from "@/lib/i18n-config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const alternates = buildAlternates("/", locale);
  return {
    title: { absolute: "UrGlowUp" },
    description: dict.home.heroDescription,
    openGraph: {
      title: "UrGlowUp",
      description: dict.home.heroDescription,
      url: `/${locale}`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const p = (path: string) => `/${locale}${path}`;

  const [categories, businesses] = await Promise.all([
    getMarketplaceCategories(),
    getMarketplaceBusinesses(),
  ]);

  const activeCategories = categories.filter((c) => c.businessCount > 0);
  const featuredBusinesses = businesses.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-background px-4 py-14 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {dict.home.badge}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.08] tracking-[-0.02em] md:text-6xl">
            {dict.home.heroTitle}{" "}
            <span className="text-brand-pink-foreground">{dict.home.heroBrand}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            {dict.home.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={p("/explore")} className={cn(buttonVariants({ size: "lg" }))}>
              {dict.home.ctaExplore}
            </Link>
            <Link
              href={p("/for-business")}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {dict.home.ctaForBusiness}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats / Trust bar */}
      <HomeTrustBar />

      {/* Category browse */}
      {activeCategories.length > 0 && (
        <section className="bg-surface-pink px-4 py-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {dict.home.categoriesLabel}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
                  {dict.home.categoriesTitle}
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
                  ? "grid-cols-1 max-w-[10rem]"
                  : activeCategories.length === 2
                    ? "grid-cols-2 max-w-xs"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              )}
            >
              {activeCategories.slice(0, 10).map((category) => (
                <CategoryCard key={category.id} category={category} locale={locale as Locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured businesses */}
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
              <BusinessGrid businesses={featuredBusinesses} locale={locale as Locale} />
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <HomeHowItWorks />

      {/* Verified appointment callout */}
      <HomeVerifiedCallout />

      {/* Business owner CTA */}
      <HomeBusinessCTA />
    </div>
  );
}
