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
  const title = `${district}, ${city} — Güzellik & Kişisel Bakım`;
  const description = `${district}, ${city}'deki güzellik ve kişisel bakım uzmanlarını UrGlowUp'ta keşfedin.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`,
    },
    alternates: {
      canonical: `/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`,
    },
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
      city,
      district,
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
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3.5 text-border" />
        <Link href="/explore" className="hover:underline">
          Keşfet
        </Link>
        <ChevronRight className="size-3.5 text-border" />
        <Link
          href={`/city/${encodeURIComponent(city)}`}
          className="hover:underline"
        >
          {city}
        </Link>
        <ChevronRight className="size-3.5 text-border" />
        <span className="font-medium text-foreground">{district}</span>
      </nav>

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          İlçe
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <MapPin className="size-5 shrink-0 text-muted-foreground" />
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">
            {district}, {city}
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasAnyFilter
            ? `${businesses.length} uzman bulundu`
            : `${businesses.length} uzman`}
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
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
          emptyMessage={`${district}, ${city}'de henüz listelenmiş uzman yok.`}
        />
      )}
    </div>
  );
}
