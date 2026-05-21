import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  getMarketplaceCities,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { CategoryCard } from "@/components/marketplace/category-card";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { EmptyFilterState } from "@/components/marketplace/empty-filter-state";

export const metadata: Metadata = {
  title: "Güzellik & Kişisel Bakım Uzmanlarını Keşfet",
  description:
    "Size yakın güzellik ve kişisel bakım uzmanlarını keşfedin. Kuaförler, nail salonu, cilt bakımı ve daha fazlasını bulun.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [businesses, categories, cities] = await Promise.all([
    getMarketplaceBusinesses({
      q:            filters.q,
      categorySlug: filters.categorySlug,
      city:         filters.city,
      minRating:    filters.minRating,
      hasMedia:     filters.hasMedia || undefined,
      hasHours:     filters.hasHours || undefined,
    }),
    getMarketplaceCategories(),
    getMarketplaceCities(),
  ]);

  const activeCategories = categories.filter((c) => c.businessCount > 0);
  const hasAnyFilter = !!(
    filters.q || filters.categorySlug || filters.city ||
    filters.minRating || filters.hasMedia || filters.hasHours
  );

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-5 text-center sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Güzellik &amp; Kişisel Bakım
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          Uzmanları Keşfet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Size yakın uzmanları keşfedin — gerçek çalışmaları görün, yorumları
          okuyun ve randevu alın.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 rounded-2xl bg-surface-cream px-5 py-4 sm:mb-8">
        <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
          <FilterBar
            categories={activeCategories.map((c) => ({ name: c.name, slug: c.slug }))}
            cities={cities}
            showCategory
            showCity
          />
        </Suspense>
      </div>

      {/* Browse sections — hidden when any filter is active */}
      {!hasAnyFilter && activeCategories.length > 0 && (
        <section className="mb-7 sm:mb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Kategoriler
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.015em]">
                Ne arıyorsun?
              </h2>
            </div>
            <Link
              href="/explore"
              className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Tümünü keşfet →
            </Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {activeCategories.map((category) => (
              <div key={category.id} className="w-[42vw] max-w-[160px] shrink-0 snap-start sm:w-auto">
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasAnyFilter && cities.length > 0 && (
        <section className="mb-7 sm:mb-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Şehirler
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.015em]">
              Şehrine göre gözat
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {cities.map(({ city, count }) => (
              <Link
                key={city}
                href={`/city/${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm transition-colors hover:bg-surface-cream"
              >
                {city}
                <span className="text-xs text-muted-foreground">({count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section>
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground">
            {hasAnyFilter
              ? `${businesses.length} uzman bulundu`
              : businesses.length > 0
                ? `Tüm uzmanlar · ${businesses.length} sonuç`
                : "Tüm Uzmanlar"}
          </p>
        </div>

        {businesses.length === 0 && hasAnyFilter ? (
          <EmptyFilterState clearHref="/explore" />
        ) : (
          <BusinessGrid
            businesses={businesses}
            emptyMessage="Henüz listelenmiş uzman yok. Yakında tekrar kontrol edin."
          />
        )}
      </section>
    </div>
  );
}
