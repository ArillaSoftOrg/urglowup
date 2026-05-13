import type { Metadata } from "next";
import Link from "next/link";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  getMarketplaceCities,
} from "@/lib/queries/marketplace";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { CategoryCard } from "@/components/marketplace/category-card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Explore Beauty & Personal Care",
  description:
    "Browse beauty and personal care professionals near you. Find hair salons, nail salons, skin care, and more.",
};

export default async function ExplorePage() {
  const [businesses, categories, cities] = await Promise.all([
    getMarketplaceBusinesses(),
    getMarketplaceCategories(),
    getMarketplaceCities(),
  ]);

  const activeCategories = categories.filter((c) => c.businessCount > 0);

  return (
    <div className="container mx-auto space-y-12 px-4 py-10">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Explore Beauty & Personal Care
        </h1>
        <p className="mt-3 text-muted-foreground">
          Discover professionals near you — view real work, read verified
          reviews, and request appointments.
        </p>
      </div>

      {/* Browse by Category */}
      {activeCategories.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Browse by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {activeCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by City */}
      {cities.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Browse by City</h2>
          <div className="flex flex-wrap gap-2">
            {cities.map(({ city, count }) => (
              <Link
                key={city}
                href={`/city/${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                {city}
                <span className="text-xs text-muted-foreground">({count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Businesses */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            All Professionals
            {businesses.length > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({businesses.length})
              </span>
            )}
          </h2>
        </div>
        <BusinessGrid
          businesses={businesses}
          emptyMessage="No professionals listed yet. Check back soon."
        />
      </section>
    </div>
  );
}
