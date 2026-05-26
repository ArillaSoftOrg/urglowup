import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  getMarketplaceCities,
  parseMarketplaceFilters,
} from "@/lib/queries/marketplace";
import { getExplorePosts } from "@/lib/queries/posts";
import { getCurrentUser } from "@/lib/auth";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { CategoryCard } from "@/components/marketplace/category-card";
import { SearchPanel } from "@/components/marketplace/search-panel";
import { EmptyFilterState } from "@/components/marketplace/empty-filter-state";
import { ExploreTabs } from "@/components/explore/explore-tabs";
import { PostFeed } from "@/components/explore/post-feed";
import { getDictionary } from "@/lib/get-dictionary";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import type { Locale } from "@/lib/i18n-config";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const alternates = buildAlternates("/explore", locale);
  return {
    title: dict.explore.searchTitle,
    description: dict.explore.searchDescription,
    openGraph: {
      title: dict.explore.searchTitle,
      description: dict.explore.searchDescription,
      url: `/${locale}/explore`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

export default async function LocaleExplorePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const p = (path: string) => `/${locale}${path}`;

  const rawParams = await searchParams;
  const tab = (rawParams.tab as string) ?? "isletmeler";
  const filters = parseMarketplaceFilters(rawParams);

  const categories = await getMarketplaceCategories();
  const activeCategories = categories.filter((c) => c.businessCount > 0);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <Suspense fallback={<div className="mb-6 h-10" />}>
        <ExploreTabs activeTab={tab} />
      </Suspense>

      {tab === "ilham" ? (
        <InspirationTab
          categories={activeCategories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
        />
      ) : (
        <BusinessesTab
          filters={filters}
          activeCategories={activeCategories}
          dict={dict}
          locale={locale}
          p={p}
        />
      )}
    </div>
  );
}

async function InspirationTab({
  categories,
}: {
  categories: Array<{ id: string; name: string; slug: string }>;
}) {
  const user = await getCurrentUser().catch(() => null);
  const { posts, nextCursor } = await getExplorePosts({
    take: 20,
    userId: user?.id,
  });

  return (
    <PostFeed
      initialPosts={posts}
      initialNextCursor={nextCursor}
      categories={categories}
      isLoggedIn={!!user}
    />
  );
}

async function BusinessesTab({
  filters,
  activeCategories,
  dict,
  locale,
  p,
}: {
  filters: ReturnType<typeof parseMarketplaceFilters>;
  activeCategories: Awaited<ReturnType<typeof getMarketplaceCategories>>;
  dict: Awaited<ReturnType<typeof getDictionary>>;
  locale: string;
  p: (path: string) => string;
}) {
  const [businesses, cities] = await Promise.all([
    getMarketplaceBusinesses({
      q:            filters.q,
      categorySlug: filters.categorySlug,
      city:         filters.city,
      minRating:    filters.minRating,
      hasMedia:     filters.hasMedia || undefined,
      hasHours:     filters.hasHours || undefined,
    }),
    getMarketplaceCities(),
  ]);

  const hasAnyFilter = !!(
    filters.q || filters.categorySlug || filters.city ||
    filters.minRating || filters.hasMedia || filters.hasHours
  );

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-3xl border border-border/60 bg-surface-cream lg:mb-10">
        <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
          <div className="mb-3 sm:mb-4">
            <h1 className="text-lg font-semibold tracking-[-0.02em] sm:text-xl md:text-2xl">
              {dict.explore.searchTitle}
            </h1>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
              {dict.explore.searchDescription}
            </p>
          </div>
          <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-brand-pink/8" />}>
            <SearchPanel
              categories={activeCategories.map((c) => ({ name: c.name, slug: c.slug }))}
              cities={cities}
            />
          </Suspense>
        </div>
      </div>

      {!hasAnyFilter && activeCategories.length > 0 && (
        <section className="mb-9 lg:mb-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-[-0.015em] sm:text-2xl">
              {dict.explore.categoriesTitle}
            </h2>
            <Link
              href={p("/explore")}
              className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {dict.explore.allCategories}
            </Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
            {activeCategories.map((category) => (
              <div key={category.id} className="w-[40vw] max-w-[165px] shrink-0 snap-start sm:w-auto">
                <CategoryCard category={category} locale={locale} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasAnyFilter && cities.length > 0 && (
        <section className="mb-8 lg:mb-10">
          <h2 className="mb-3 text-base font-semibold">
            {dict.explore.regionTitle}
          </h2>
          <div className="flex flex-wrap gap-2">
            {cities.map(({ city, count }) => (
              <Link
                key={city}
                href={`${p("/city")}/${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm transition-colors hover:bg-surface-cream"
              >
                {city}
                <span className="text-xs text-muted-foreground">({count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        {hasAnyFilter && (
          <p className="mb-4 text-sm font-medium text-muted-foreground md:text-base">
            {dict.explore.professionalCount(businesses.length)}
          </p>
        )}

        {businesses.length === 0 && hasAnyFilter ? (
          <EmptyFilterState clearHref={p("/explore")} />
        ) : (
          <BusinessGrid
            businesses={businesses}
            emptyMessage={dict.explore.emptyMessage}
            locale={locale}
          />
        )}
      </section>
    </>
  );
}
