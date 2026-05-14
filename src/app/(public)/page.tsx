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
      <section className="relative px-4 py-24 text-center md:py-36">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            UrGlowUp
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Güzellik &amp; Kişisel Bakım{" "}
            <span className="text-primary">Uzmanlarını</span> Keşfet
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
            Gerçek çalışmaları görün, doğrulanmış yorumları okuyun ve güvenle
            randevu alın.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className={cn(buttonVariants({ size: "lg" }), "px-8")}
            >
              Hemen Keşfet
            </Link>
            <Link
              href="/for-business"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "px-8"
              )}
            >
              İşletmeler İçin
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {activeCategories.length > 0 && (
        <section className="bg-muted/30 px-4 py-16">
          <div className="container mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Kategoriye Göre Gözat</h2>
              <Link
                href="/explore"
                className="text-sm text-muted-foreground hover:underline"
              >
                Tümünü gör →
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
              <h2 className="text-2xl font-bold">Öne Çıkan Uzmanlar</h2>
              <Link
                href="/explore"
                className="text-sm text-muted-foreground hover:underline"
              >
                Tümünü gör →
              </Link>
            </div>
            <BusinessGrid businesses={featuredBusinesses} />
          </div>
        </section>
      )}

      {/* For Business CTA */}
      <section className="bg-muted/30 px-4 py-16 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold">Güzellik uzmanı mısınız?</h2>
          <p className="mt-3 text-muted-foreground">
            Ücretsiz profilinizi oluşturun, çalışmalarınızı sergileyin ve bugün
            randevu almaya başlayın.
          </p>
          <Link
            href="/for-business"
            className={cn(buttonVariants({ size: "lg" }), "mt-6")}
          >
            Ücretsiz Başlayın
          </Link>
        </div>
      </section>
    </div>
  );
}
