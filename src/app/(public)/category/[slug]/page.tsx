import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategoryBySlug,
  getMarketplaceCategories,
  getMarketplaceCities,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";
import { getCategoryLabel } from "@/lib/category-labels";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { EmptyFilterState } from "@/components/marketplace/empty-filter-state";
import { ChevronRight } from "lucide-react";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  const categories = await getMarketplaceCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getMarketplaceCategoryBySlug(slug);
  if (!category) return { title: "Kategori Bulunamadı" };

  const displayName = getCategoryLabel(slug, category.name);
  return {
    title: displayName,
    description:
      category.description ??
      `UrGlowUp'ta ${displayName} uzmanlarını keşfedin.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [category, businesses, cities] = await Promise.all([
    getMarketplaceCategoryBySlug(slug),
    getMarketplaceBusinesses({
      categorySlug: slug,
      city:         filters.city,
      q:            filters.q,
      minRating:    filters.minRating,
      hasMedia:     filters.hasMedia || undefined,
      hasHours:     filters.hasHours || undefined,
    }),
    getMarketplaceCities(),
  ]);

  if (!category) notFound();

  const displayName = getCategoryLabel(slug, category.name);

  const hasAnyFilter = !!(
    filters.q || filters.city || filters.minRating ||
    filters.hasMedia || filters.hasHours
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
        <span className="font-medium text-foreground">{displayName}</span>
      </nav>

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Kategori
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.02em]">{displayName}</h1>
        {category.description && (
          <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {hasAnyFilter
            ? `${businesses.length} uzman bulundu`
            : `${businesses.length} uzman`}
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
        <FilterBar cities={cities} showCity />
      </Suspense>

      {/* Results */}
      {businesses.length === 0 && hasAnyFilter ? (
        <EmptyFilterState clearHref={`/category/${slug}`} />
      ) : (
        <BusinessGrid
          businesses={businesses}
          emptyMessage={`${displayName} kategorisinde henüz uzman listelenmedi.`}
        />
      )}
    </div>
  );
}
