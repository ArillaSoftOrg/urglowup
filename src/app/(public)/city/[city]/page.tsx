import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { EmptyFilterState } from "@/components/marketplace/empty-filter-state";
import { ChevronRight, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { buildAlternates } from "@/lib/i18n-metadata";

interface PageProps {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const title = `${city} — Güzellik & Kişisel Bakım`;
  const description = `${city}'deki güzellik ve kişisel bakım uzmanlarını UrGlowUp'ta keşfedin.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/city/${encodeURIComponent(city)}`,
    },
    alternates: buildAlternates(`/city/${encodeURIComponent(city)}`, "tr"),
  };
}

export default async function CityPage({ params, searchParams }: PageProps) {
  const { city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [businesses, districts, categories] = await Promise.all([
    getMarketplaceBusinesses({
      city,
      district:     filters.district,
      categorySlug: filters.categorySlug,
      q:            filters.q,
      minRating:    filters.minRating,
      hasMedia:     filters.hasMedia || undefined,
      hasHours:     filters.hasHours || undefined,
      sort:          filters.sort,
    }),
    db.business.findMany({
      where: {
        status: "ACTIVE_MARKETPLACE",
        isMarketplaceVisible: true,
        city: { equals: city, mode: "insensitive" },
        district: { not: null },
      },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
    getMarketplaceCategories(),
  ]);

  const districtList = districts
    .map((d) => d.district)
    .filter((d): d is string => d !== null);

  const hasAnyFilter = !!(
    filters.q || filters.categorySlug || filters.district ||
    filters.minRating || filters.hasMedia || filters.hasHours
  );

  return (
    <div className="container mx-auto space-y-5 px-4 py-6 sm:space-y-8 sm:py-10">
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
        <span className="font-medium text-foreground">{city}</span>
      </nav>

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Şehir
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <MapPin className="size-5 shrink-0 text-muted-foreground" />
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">
            {city} Uzmanları
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
          districts={districtList}
          showCategory
          showDistrict
        />
      </Suspense>

      {/* District navigation pills — hidden when district filter is active */}
      {districtList.length > 0 && !filters.district && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            İlçeye göre gözat
          </p>
          <div className="flex flex-wrap gap-2">
            {districtList.map((district) => (
              <Link
                key={district}
                href={`/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`}
                className="inline-flex items-center rounded-full border border-border/60 bg-surface-cream px-4 py-1.5 text-sm transition-colors hover:bg-surface-pink"
              >
                {district}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {businesses.length === 0 && hasAnyFilter ? (
        <EmptyFilterState clearHref={`/city/${encodeURIComponent(city)}`} />
      ) : (
        <BusinessGrid
          businesses={businesses}
          emptyMessage={`${city}'de henüz listelenmiş uzman yok.`}
        />
      )}
    </div>
  );
}
