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
  title: "Explore Beauty & Personal Care",
  description:
    "Browse beauty and personal care professionals near you. Find hair salons, nail salons, skin care, and more.",
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
    <div className="container mx-auto space-y-12 px-4 py-10">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Explore Beauty & Personal Care
        </h1>
        <p className="mt-3 text-muted-foreground">
          Discover professionals near you — view real work, read verified
          reviews, and request appointments.
        </p>
      </div>

      {/* Search & Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" />}>
        <FilterBar
          categories={activeCategories.map((c) => ({ name: c.name, slug: c.slug }))}
          cities={cities}
          showCategory
          showCity
        />
      </Suspense>

      {/* Browse sections — hidden when any filter is active */}
      {!hasAnyFilter && activeCategories.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Browse by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {activeCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {!hasAnyFilter && cities.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Browse by City</h2>
          <div className="flex flex-wrap gap-2">
            {cities.map(({ city, count }) => (
              <Link
                key={city}
                href={`/city/${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-sm transition-colors hover:bg-accent"
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {hasAnyFilter
              ? `${businesses.length} professional${businesses.length !== 1 ? "s" : ""} found`
              : "All Professionals"}
            {!hasAnyFilter && businesses.length > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({businesses.length})
              </span>
            )}
          </h2>
        </div>

        {businesses.length === 0 && hasAnyFilter ? (
          <EmptyFilterState clearHref="/explore" />
        ) : (
          <BusinessGrid
            businesses={businesses}
            emptyMessage="No professionals listed yet. Check back soon."
          />
        )}
      </section>
    </div>
  );
}
