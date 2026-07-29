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
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import { getDictionary } from "@/lib/get-dictionary";
import type { Locale } from "@/lib/i18n-config";

interface PageProps {
  params: Promise<{ locale: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  const title = `${city} — Beauty & Personal Care`;
  const description = `Discover beauty and personal care professionals in ${city} on UrGlowUp.`;
  const alternates = buildAlternates(`/city/${encodeURIComponent(city)}`, locale);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${locale}/city/${encodeURIComponent(city)}`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

export default async function LocaleCityPage({ params, searchParams }: PageProps) {
  const { locale, city: rawCity } = await params;
  const dict = await getDictionary(locale as Locale);
  const city = decodeURIComponent(rawCity);
  const p = (path: string) => `/${locale}${path}`;

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
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={p("/")} className="hover:underline">Home</Link>
        <ChevronRight className="size-3.5 text-border" />
        <Link href={p("/explore")} className="hover:underline">
          {dict.nav.explore}
        </Link>
        <ChevronRight className="size-3.5 text-border" />
        <span className="font-medium text-foreground">{city}</span>
      </nav>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          City
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <MapPin className="size-5 shrink-0 text-muted-foreground" />
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">
            {city} Professionals
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasAnyFilter
            ? dict.explore.professionalCount(businesses.length)
            : `${businesses.length} professionals`}
        </p>
      </div>

      <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
        <FilterBar
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          districts={districtList}
          showCategory
          showDistrict
        />
      </Suspense>

      {districtList.length > 0 && !filters.district && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Browse by district
          </p>
          <div className="flex flex-wrap gap-2">
            {districtList.map((district) => (
              <Link
                key={district}
                href={`${p("/city")}/${encodeURIComponent(city)}/${encodeURIComponent(district)}`}
                className="inline-flex items-center rounded-full border border-border/60 bg-surface-cream px-4 py-1.5 text-sm transition-colors hover:bg-surface-pink"
              >
                {district}
              </Link>
            ))}
          </div>
        </div>
      )}

      {businesses.length === 0 && hasAnyFilter ? (
        <EmptyFilterState clearHref={p(`/city/${encodeURIComponent(city)}`)} />
      ) : (
        <BusinessGrid
          businesses={businesses}
          emptyMessage={`No professionals listed in ${city} yet.`}
          locale={locale}
        />
      )}
    </div>
  );
}
