import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategoryBySlug,
  CATEGORY_LOCATION_INDEX_THRESHOLD,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";
import { getCategoryLabel } from "@/lib/category-labels";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { EmptyFilterState } from "@/components/marketplace/empty-filter-state";
import { ChevronRight, MapPin } from "lucide-react";
import { buildAlternates } from "@/lib/i18n-metadata";
import { absoluteUrl } from "@/lib/seo";
import { db } from "@/lib/db";

interface PageProps {
  params: Promise<{ slug: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const [category, businesses] = await Promise.all([
    getMarketplaceCategoryBySlug(slug),
    getMarketplaceBusinesses({ categorySlug: slug, city }),
  ]);
  if (!category) return { title: "Kategori Bulunamadı" };

  const displayName = getCategoryLabel(slug, category.name);
  const title = `${displayName} - ${city}`;
  const description = `${city}'deki ${displayName.toLowerCase()} uzmanlarını UrGlowUp'ta keşfedin.`;
  const path = `/category/${slug}/${encodeURIComponent(city)}`;

  return {
    title,
    description,
    ...(businesses.length < CATEGORY_LOCATION_INDEX_THRESHOLD && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      title,
      description,
      url: path,
    },
    alternates: buildAlternates(path, "tr"),
  };
}

export default async function CategoryCityPage({ params, searchParams }: PageProps) {
  const { slug, city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [category, businesses, districts] = await Promise.all([
    getMarketplaceCategoryBySlug(slug),
    getMarketplaceBusinesses({
      categorySlug: slug,
      city,
      district: filters.district,
      q: filters.q,
      minRating: filters.minRating,
      hasMedia: filters.hasMedia || undefined,
      hasHours: filters.hasHours || undefined,
    }),
    db.business.findMany({
      where: {
        status: "ACTIVE_MARKETPLACE",
        isMarketplaceVisible: true,
        city: { equals: city, mode: "insensitive" },
        district: { not: null },
        categories: { some: { category: { slug } } },
      },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
  ]);

  if (!category) notFound();

  const displayName = getCategoryLabel(slug, category.name);
  const path = `/category/${slug}/${encodeURIComponent(city)}`;
  const districtList = districts
    .map((d) => d.district)
    .filter((d): d is string => d !== null);

  const hasAnyFilter = !!(
    filters.q ||
    filters.district ||
    filters.minRating ||
    filters.hasMedia ||
    filters.hasHours
  );

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${displayName} - ${city}`,
    url: absoluteUrl(path),
    about: { "@type": "Thing", name: displayName },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: businesses.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/b/${b.slug}`),
        name: b.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <div className="container mx-auto space-y-5 px-4 py-6 sm:space-y-8 sm:py-10">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            Ana Sayfa
          </Link>
          <ChevronRight className="size-3.5 text-border" />
          <Link href={`/category/${slug}`} className="hover:underline">
            {displayName}
          </Link>
          <ChevronRight className="size-3.5 text-border" />
          <span className="font-medium text-foreground">{city}</span>
        </nav>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Kategori & Şehir
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <MapPin className="size-5 shrink-0 text-muted-foreground" />
            <h1 className="text-3xl font-semibold tracking-[-0.02em]">
              {displayName} - {city}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasAnyFilter
              ? `${businesses.length} uzman bulundu`
              : `${businesses.length} uzman`}
          </p>
        </div>

        <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
          <FilterBar districts={districtList} showDistrict />
        </Suspense>

        {districtList.length > 0 && !filters.district && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              İlçeye göre göz at
            </p>
            <div className="flex flex-wrap gap-2">
              {districtList.map((district) => (
                <Link
                  key={district}
                  href={`${path}/${encodeURIComponent(district)}`}
                  className="inline-flex items-center rounded-full border border-border/60 bg-surface-cream px-4 py-1.5 text-sm transition-colors hover:bg-surface-pink"
                >
                  {district}
                </Link>
              ))}
            </div>
          </div>
        )}

        {businesses.length === 0 && hasAnyFilter ? (
          <EmptyFilterState clearHref={path} />
        ) : (
          <BusinessGrid
            businesses={businesses}
            emptyMessage={`${city}'de ${displayName.toLowerCase()} kategorisinde henüz uzman listelenmedi.`}
          />
        )}
      </div>
    </>
  );
}
