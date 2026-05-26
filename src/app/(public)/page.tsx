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
import { HomeHeroCTAs } from "@/components/home/home-hero-ctas";
import { buildAlternates } from "@/lib/i18n-metadata";

export const metadata: Metadata = {
  title: { absolute: "UrGlowUp" },
  description:
    "Discover beauty and personal care businesses, view real work, and request appointments with confidence.",
  openGraph: {
    title: "UrGlowUp",
    description:
      "Discover beauty and personal care businesses, view real work, and request appointments with confidence.",
    url: "/",
    locale: "tr_TR",
  },
  alternates: buildAlternates("/", "tr"),
};

export default async function HomePage() {
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
            Güzellik &amp; Kişisel Bakım
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.08] tracking-[-0.02em] md:text-6xl">
            Kendine en iyi bakımı{" "}
            <span className="text-brand-pink-foreground">hak ediyorsun.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Sana yakın güzellik uzmanlarını keşfet. Gerçek çalışmaları gör,
            doğrulanmış yorumları oku ve güvenle randevu al.
          </p>
          <HomeHeroCTAs />
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
                  Kategoriler
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
                  Ne arıyorsun?
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
                  ? "grid-cols-1 max-w-[10rem]"
                  : activeCategories.length === 2
                    ? "grid-cols-2 max-w-xs"
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

      {/* Featured businesses */}
      {featuredBusinesses.length > 0 && (
        <section className="bg-background px-4 py-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Öne Çıkanlar
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
                  Beğenilen uzmanlar
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Müşterilerimizin en çok tercih ettiği uzmanlar.
                </p>
              </div>
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

      {/* How it works */}
      <HomeHowItWorks />

      {/* Verified appointment callout */}
      <HomeVerifiedCallout />

      {/* Business owner CTA */}
      <HomeBusinessCTA />
    </div>
  );
}
