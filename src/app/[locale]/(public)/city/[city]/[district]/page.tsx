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
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import { getDictionary } from "@/lib/get-dictionary";
import type { Locale } from "@/lib/i18n-config";

interface PageProps {
  params: Promise<{ locale: string; city: string; district: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, city: rawCity, district: rawDistrict } = await params;
  const city = decodeURIComponent(rawCity);
  const district = decodeURIComponent(rawDistrict);
  const title = `${district}, ${city} — Beauty & Personal Care`;
  const description = `Discover beauty and personal care professionals in ${district}, ${city} on UrGlowUp.`;
  const alternates = buildAlternates(
    `/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`,
    locale
  );
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${locale}/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

export default async function LocaleDistrictPage({ params, searchParams }: PageProps) {
  const { locale, city: rawCity, district: rawDistrict } = await params;
  const dict = await getDictionary(locale as Locale);
  const city = decodeURIComponent(rawCity);
  const district = decodeURIComponent(rawDistrict);
  const p = (path: string) => `/${locale}${path}`;

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
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={p("/")} className="hover:underline">Home</Link>
        <ChevronRight className="size-3.5 text-border" />
        <Link href={p("/explore")} className="hover:underline">
          {dict.nav.explore}
        </Link>
        <ChevronRight className="size-3.5 text-border" />
        <Link href={p(`/city/${encodeURIComponent(city)}`)} className="hover:underline">
          {city}
        </Link>
        <ChevronRight className="size-3.5 text-border" />
        <span className="font-medium text-foreground">{district}</span>
      </nav>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          District
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <MapPin className="size-5 shrink-0 text-muted-foreground" />
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">
            {district}, {city}
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
          showCategory
        />
      </Suspense>

      {businesses.length === 0 && hasAnyFilter ? (
        <EmptyFilterState
          clearHref={p(`/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`)}
        />
      ) : (
        <BusinessGrid
          businesses={businesses}
          emptyMessage={`No professionals listed in ${district}, ${city} yet.`}
          locale={locale}
        />
      )}
    </div>
  );
}
