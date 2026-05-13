import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getMarketplaceBusinesses,
  getMarketplaceCategories,
} from "@/lib/queries/marketplace";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { CategoryCard } from "@/components/marketplace/category-card";

export const revalidate = 3600;

export default async function HomePage() {
  const [categories, businesses] = await Promise.all([
    getMarketplaceCategories(),
    getMarketplaceBusinesses(),
  ]);

  const activeCategories = categories.filter((c) => c.businessCount > 0);
  const featuredBusinesses = businesses.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="px-4 py-20 text-center md:py-32">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Discover Beauty &amp; Personal Care Professionals
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          View real work, read verified reviews, and request appointments with
          confidence.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/explore"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Explore Now
          </Link>
          <Link
            href="/for-business"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            For Business
          </Link>
        </div>
      </section>

      {/* Categories */}
      {activeCategories.length > 0 && (
        <section className="bg-muted/30 px-4 py-16">
          <div className="container mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Browse by Category</h2>
              <Link
                href="/explore"
                className="text-sm text-muted-foreground hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {activeCategories.slice(0, 10).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Businesses */}
      {featuredBusinesses.length > 0 && (
        <section className="px-4 py-16">
          <div className="container mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Featured Professionals</h2>
              <Link
                href="/explore"
                className="text-sm text-muted-foreground hover:underline"
              >
                View all →
              </Link>
            </div>
            <BusinessGrid businesses={featuredBusinesses} />
          </div>
        </section>
      )}

      {/* For Business CTA */}
      <section className="bg-muted/30 px-4 py-16 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold">Are you a beauty professional?</h2>
          <p className="mt-3 text-muted-foreground">
            Create your free profile, showcase your work, and start receiving
            appointment requests today.
          </p>
          <Link
            href="/for-business"
            className={cn(buttonVariants({ size: "lg" }), "mt-6")}
          >
            Get Started for Free
          </Link>
        </div>
      </section>
    </div>
  );
}
