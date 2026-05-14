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
  if (!category) return { title: "Category Not Found" };

  return {
    title: category.name,
    description:
      category.description ??
      `Browse ${category.name} professionals on UrGlowUp.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [category, businesses, cities] = await Promise.all([
    getMarketplaceCategoryBySlug(slug),
    getMarketplaceBusinesses({
      categorySlug: slug, // always the route slug
      city:         filters.city,
      q:            filters.q,
      minRating:    filters.minRating,
      hasMedia:     filters.hasMedia || undefined,
      hasHours:     filters.hasHours || undefined,
    }),
    getMarketplaceCities(),
  ]);

  if (!category) notFound();

  const hasAnyFilter = !!(
    filters.q || filters.city || filters.minRating ||
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
        <span className="font-medium text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {businesses.length} professional{businesses.length !== 1 ? "s" : ""}
          {hasAnyFilter && " found"}
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" />}>
        <FilterBar cities={cities} showCity />
      </Suspense>

      {/* Results */}
      {businesses.length === 0 && hasAnyFilter ? (
        <EmptyFilterState clearHref={`/category/${slug}`} />
      ) : (
        <BusinessGrid
          businesses={businesses}
          emptyMessage={`No ${category.name} professionals listed yet.`}
        />
      )}
    </div>
  );
}
