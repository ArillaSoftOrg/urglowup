import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getMarketplaceBusinesses,
  getMarketplaceDistricts,
  getMarketplaceCategories,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { EmptyFilterState } from "@/components/marketplace/empty-filter-state";
import { ChevronRight, MapPin } from "lucide-react";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ city: string; district: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const combos = await getMarketplaceDistricts();
  return combos.map(({ city, district }) => ({
    city: encodeURIComponent(city),
    district: encodeURIComponent(district),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: rawCity, district: rawDistrict } = await params;
  const city = decodeURIComponent(rawCity);
  const district = decodeURIComponent(rawDistrict);
  return {
    title: `${district}, ${city}`,
    description: `Find beauty and personal care professionals in ${district}, ${city} on UrGlowUp.`,
  };
}

export default async function DistrictPage({ params, searchParams }: PageProps) {
  const { city: rawCity, district: rawDistrict } = await params;
  const city = decodeURIComponent(rawCity);
  const district = decodeURIComponent(rawDistrict);
  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [businesses, categories] = await Promise.all([
    getMarketplaceBusinesses({
      city,     // always from route
      district, // always from route
      categorySlug: filters.categorySlug,
      q:            filters.q,
      minRating:    filters.minRating,
      hasMedia:     filters.hasMedia || undefined,
      hasHours:     filters.hasHours || undefined,
    }),
    getMarketplaceCategories(),
  ]);

  const hasAnyFilter = !!(
    filters.q || filters.categorySlug || filters.minRating ||
    filters.hasMedia || filters.hasHours
  );

  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/explore" className="hover:underline">
          Explore
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/city/${encodeURIComponent(city)}`}
          className="hover:underline"
        >
          {city}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{district}</span>
      </nav>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            {district}, {city}
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {businesses.length} professional{businesses.length !== 1 ? "s" : ""}
          {hasAnyFilter && " found"}
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" />}>
        <FilterBar
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          showCategory
        />
      </Suspense>

      {/* Results */}
      {businesses.length === 0 && hasAnyFilter ? (
        <EmptyFilterState
          clearHref={`/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`}
        />
      ) : (
        <BusinessGrid
          businesses={businesses}
          emptyMessage={`No professionals listed in ${district}, ${city} yet.`}
        />
      )}
    </div>
  );
}
