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
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import { absoluteUrl } from "@/lib/seo";
import { getDictionary } from "@/lib/get-dictionary";
import type { Locale } from "@/lib/i18n-config";
import { db } from "@/lib/db";
import { JsonLd } from "@/components/shared/json-ld";

interface PageProps {
  params: Promise<{ locale: string; slug: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug, city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const [category, businesses] = await Promise.all([
    getMarketplaceCategoryBySlug(slug),
    getMarketplaceBusinesses({ categorySlug: slug, city }),
  ]);
  if (!category) return { title: "Category Not Found" };

  const displayName = getCategoryLabel(slug, category.name);
  const title = `${displayName} — ${city}`;
  const description = `Find ${displayName.toLowerCase()} professionals in ${city} on UrGlowUp.`;
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
      url: `/${locale}${path}`,
      locale: getOgLocale(locale),
    },
    alternates: buildAlternates(path, locale),
  };
}

export default async function LocaleCategoryCityPage({ params, searchParams }: PageProps) {
  const { locale, slug, city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const dict = await getDictionary(locale as Locale);
  const p = (path: string) => `/${locale}${path}`;

  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [category, businesses, districts] = await Promise.all([
    getMarketplaceCategoryBySlug(slug),
    getMarketplaceBusinesses({
      categorySlug: slug,
      city,
      district:  filters.district,
      q:         filters.q,
      minRating: filters.minRating,
      hasMedia:  filters.hasMedia || undefined,
      hasHours:  filters.hasHours || undefined,
      sort:       filters.sort,
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
    filters.q || filters.district || filters.minRating ||
    filters.hasMedia || filters.hasHours
  );

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${displayName} — ${city}`,
    url: absoluteUrl(`/${locale}${path}`),
    about: { "@type": "Thing", name: displayName },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: businesses.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/${locale}/b/${b.slug}`),
        name: b.name,
      })),
    },
  };

  return (
    <>
      <JsonLd data={collectionJsonLd} />
      <div className="container mx-auto space-y-5 px-4 py-6 sm:space-y-8 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={p("/")} className="hover:underline">Home</Link>
          <ChevronRight className="size-3.5 text-border" />
          <Link href={p(`/category/${slug}`)} className="hover:underline">{displayName}</Link>
          <ChevronRight className="size-3.5 text-border" />
          <span className="font-medium text-foreground">{city}</span>
        </nav>

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Category & City
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <MapPin className="size-5 shrink-0 text-muted-foreground" />
            <h1 className="text-3xl font-semibold tracking-[-0.02em]">
              {displayName} — {city}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasAnyFilter
              ? dict.explore.professionalCount(businesses.length)
              : `${businesses.length} professionals`}
          </p>
        </div>

        {/* Filters */}
        <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
          <FilterBar
            districts={districtList}
            showDistrict
          />
        </Suspense>

        {/* District navigation pills — hidden when district filter is active */}
        {districtList.length > 0 && !filters.district && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Browse by district
            </p>
            <div className="flex flex-wrap gap-2">
              {districtList.map((district) => (
                <Link
                  key={district}
                  href={p(`${path}/${encodeURIComponent(district)}`)}
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
          <EmptyFilterState clearHref={p(path)} />
        ) : (
          <BusinessGrid
            businesses={businesses}
            emptyMessage={`No ${displayName.toLowerCase()} professionals listed in ${city} yet.`}
            locale={locale}
          />
        )}
      </div>
    </>
  );
}
