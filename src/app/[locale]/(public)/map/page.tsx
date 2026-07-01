import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  getMarketplaceCities,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";
import { getExternalMapPlaces } from "@/lib/marketplace/external-map-places";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { MapListLayout } from "@/components/marketplace/map-list-layout";
import { ChevronRight } from "lucide-react";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import { getDictionary } from "@/lib/get-dictionary";
import type { Locale } from "@/lib/i18n-config";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Map",
    description: "Discover beauty and personal care professionals near you on the map.",
    openGraph: {
      title: "Map | UrGlowUp",
      description: "Discover beauty and personal care professionals near you on the map.",
      url: `/${locale}/map`,
      locale: getOgLocale(locale),
    },
    alternates: buildAlternates("/map", locale),
  };
}

export default async function LocaleMapPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const p = (path: string) => `/${locale}${path}`;

  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [businesses, categories, cities, externalPlaces] = await Promise.all([
    getMarketplaceBusinesses({
      categorySlug: filters.categorySlug,
      city:         filters.city,
      district:     filters.district,
      q:            filters.q,
      minRating:    filters.minRating,
      hasMedia:     filters.hasMedia || undefined,
      hasHours:     filters.hasHours || undefined,
    }),
    getMarketplaceCategories(),
    getMarketplaceCities(),
    getExternalMapPlaces(filters),
  ]);

  const hasAnyFilter = !!(
    filters.q || filters.categorySlug || filters.city || filters.district ||
    filters.minRating || filters.hasMedia || filters.hasHours
  );

  return (
    <div className="container mx-auto space-y-5 px-4 py-6 sm:space-y-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={p("/")} className="hover:underline">Home</Link>
        <ChevronRight className="size-3.5 text-border" />
        <span className="font-medium text-foreground">Map</span>
      </nav>

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Map Discovery
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.02em]">
          Discover professionals near you
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasAnyFilter
            ? dict.explore.professionalCount(businesses.length)
            : `${businesses.length} professionals`}
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
        <FilterBar
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          cities={cities}
          showCategory
          showCity
        />
      </Suspense>

      {/* Map + list */}
      {mapsApiKey ? (
        <MapListLayout
          businesses={businesses}
          externalPlaces={externalPlaces}
          apiKey={mapsApiKey}
          emptyMessage="No professionals match these filters."
          unlocatedNotice={(count) => `${count} businesses don't have location data yet and aren't shown on the map.`}
          noBookableNotice="No bookable businesses match this filter."
          locale={locale}
          listLabel="List"
          mapLabel="Map"
        />
      ) : (
        <p className="rounded-2xl border border-border/60 bg-surface-cream p-6 text-sm text-muted-foreground">
          The map is currently unavailable.
        </p>
      )}
    </div>
  );
}
