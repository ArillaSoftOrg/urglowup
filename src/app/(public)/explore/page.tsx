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
import { SearchPanel } from "@/components/marketplace/search-panel";
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
      {/* Compact search panel */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-border/60 bg-surface-cream lg:mb-10">
        <div className="px-5 py-5 sm:px-8 sm:py-6">
          <div className="mb-3 sm:mb-4">
            <h1 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
              Uzmanını bul
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hizmet, işletme veya kategoriye göre arama yap.
            </p>
          </div>
          <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
            <SearchPanel
              categories={activeCategories.map((c) => ({ name: c.name, slug: c.slug }))}
              cities={cities}
            />
          </Suspense>
        </div>
      </div>

      {/* Browse sections — hidden when any filter is active */}
      {!hasAnyFilter && activeCategories.length > 0 && (
        <section className="mb-9 lg:mb-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-[-0.015em] sm:text-2xl">
              Ne arıyorsun?
            </h2>
            <Link
              href="/explore"
              className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Tüm kategoriler →
            </Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
            {activeCategories.map((category) => (
              <div key={category.id} className="w-[40vw] max-w-[165px] shrink-0 snap-start sm:w-auto">
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasAnyFilter && cities.length > 0 && (
        <section className="mb-8 lg:mb-10">
          <h2 className="mb-3 text-base font-semibold">
            Bölgeye göre keşfet
          </h2>
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
        {hasAnyFilter && (
          <p className="mb-4 text-sm font-medium text-muted-foreground md:text-base">
            {businesses.length} uzman bulundu
          </p>
        )}

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
