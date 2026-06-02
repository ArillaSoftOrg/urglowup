import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  getMarketplaceCategoryBySlug,
  getMarketplaceCities,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";
import { getCategoryLabel } from "@/lib/category-labels";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { SearchPanel } from "@/components/marketplace/search-panel";
import { EmptyFilterState } from "@/components/marketplace/empty-filter-state";
import { ChevronRight } from "lucide-react";
import { buildAlternates } from "@/lib/i18n-metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getMarketplaceCategoryBySlug(slug);
  if (!category) return { title: "Kategori Bulunamadı" };

  const displayName = getCategoryLabel(slug, category.name);
  const description =
    category.description ??
    `UrGlowUp'ta ${displayName} uzmanlarını keşfedin.`;

  return {
    title: displayName,
    description,
    openGraph: {
      title: displayName,
      description,
      url: `/category/${slug}`,
      ...(category.imageUrl && {
        images: [{ url: category.imageUrl }],
      }),
    },
    alternates: buildAlternates(`/category/${slug}`, "tr"),
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const filters = parseMarketplaceFilters(rawParams);

  const [category, businesses, cities, categories] = await Promise.all([
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
    getMarketplaceCategories(),
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

      {/* Search */}
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-surface-cream">
        <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-lg font-semibold tracking-[-0.02em] sm:text-xl md:text-2xl">
              Hizmet ara
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
              Hizmet, işletme veya kategori ara.
            </p>
          </div>
          <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
            <SearchPanel
              categories={categories
                .filter((c) => c.businessCount > 0)
                .map((c) => ({ name: c.name, slug: c.slug }))}
              cities={cities}
              categoryPathPrefix="/category"
              allCategoriesHref="/explore"
            />
          </Suspense>
        </div>
      </div>

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
