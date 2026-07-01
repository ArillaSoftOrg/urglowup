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
import { buildAlternates } from "@/lib/i18n-metadata";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const metadata: Metadata = {
  title: "Harita ile Keşfet",
  description:
    "Yakınındaki güzellik ve kişisel bakım uzmanlarını harita üzerinde keşfet.",
  openGraph: {
    title: "Harita ile Keşfet | UrGlowUp",
    description:
      "Yakınındaki güzellik ve kişisel bakım uzmanlarını harita üzerinde keşfet.",
    url: "/map",
    locale: "tr_TR",
  },
  alternates: buildAlternates("/map", "tr"),
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MapPage({ searchParams }: PageProps) {
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
        <Link href="/" className="hover:underline">Ana Sayfa</Link>
        <ChevronRight className="size-3.5 text-border" />
        <span className="font-medium text-foreground">Harita</span>
      </nav>

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Harita ile Keşfet
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.02em]">
          Yakınındaki uzmanları keşfet
        </h1>
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
          emptyMessage="Bu filtrelerle eşleşen uzman bulunamadı."
          unlocatedNotice={(count) => `${count} işletmenin konum bilgisi henüz haritada gösterilemiyor.`}
          noBookableNotice="Bu filtrede randevu alınabilir işletme yok."
          listLabel="Liste"
          mapLabel="Harita"
        />
      ) : (
        <p className="rounded-2xl border border-border/60 bg-surface-cream p-6 text-sm text-muted-foreground">
          Harita şu anda kullanılamıyor.
        </p>
      )}
    </div>
  );
}
