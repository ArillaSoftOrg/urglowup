import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Star } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

function pathWithLocale(path: string, locale?: string) {
  return locale && locale !== "tr" ? `/${locale}${path}` : path;
}

function NearbyBusinessCard({
  business,
  locale,
}: {
  business: MarketplaceBusiness;
  locale?: string;
}) {
  const category = business.categories[0]?.category.name;
  const location = [business.district, business.city].filter(Boolean).join(", ");

  return (
    <Link
      href={pathWithLocale(`/b/${business.slug}`, locale)}
      className="group block min-w-[260px] flex-1 md:min-w-0"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-surface-cream">
        {business.coverImageUrl ? (
          <Image
            src={business.coverImageUrl}
            alt={`${business.name} kapak gorseli`}
            fill
            sizes="(max-width: 768px) 70vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-surface-cream to-brand-pink/30" />
        )}
        <span className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-foreground/35 text-background backdrop-blur">
          <Heart className="size-5" />
        </span>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-bold tracking-normal text-foreground">
            {business.name}
          </h3>
          {business.reviewAvg !== null && business.reviewCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold">
              <Star className="size-4 fill-rating text-rating" />
              {(business.reviewAvg / 2).toFixed(1)}
            </span>
          )}
        </div>
        {location && <p className="line-clamp-1 text-sm text-muted-foreground">{location}</p>}
        {(category || business.reviewCount > 0) && (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {[category, business.reviewCount > 0 ? `${business.reviewCount} değerlendirme` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ProfileEndingSection({
  business,
  nearbyBusinesses,
  locale,
}: {
  business: BusinessWithDetails;
  nearbyBusinesses: MarketplaceBusiness[];
  locale?: string;
}) {
  const city = business.city ?? "yakınınızda";
  const serviceLinks = business.services
    .filter((service) => service.isActive)
    .slice(0, 6)
    .map((service) => ({
      label: service.name,
      href: pathWithLocale(`/services/${service.slug}`, locale),
    }));
  const categoryLinks = business.categories.slice(0, 6).map(({ category }) => ({
    label: category.name,
    href: pathWithLocale(`/category/${category.slug}${business.city ? `/${encodeURIComponent(business.city)}` : ""}`, locale),
  }));
  const links = [...categoryLinks, ...serviceLinks].slice(0, 9);

  if (nearbyBusinesses.length === 0 && links.length === 0) return null;

  return (
    <section className="border-t border-border/70 bg-background">
      <div className="mx-auto max-w-[1440px] space-y-14 px-5 py-12 sm:px-6 lg:px-10 lg:py-14 xl:px-12">
        {nearbyBusinesses.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-normal">
              Yakındaki mekanlar
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
              {nearbyBusinesses.slice(0, 4).map((item) => (
                <NearbyBusinessCard key={item.id} business={item} locale={locale} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-7">
          <h2 className="max-w-4xl text-3xl font-bold leading-tight tracking-normal lg:text-[34px]">
            İstediğiniz zaman, istediğiniz yerde kendinizi şımartın
          </h2>
          {business.city && (
            <Link
              href={pathWithLocale(`/city/${encodeURIComponent(business.city)}`, locale)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-base font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              Diğer işletmeler {city}
              <ArrowRight className="size-4" />
            </Link>
          )}
          {links.length > 0 && (
            <div className="grid gap-x-16 gap-y-4 pt-2 text-base sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="font-medium text-foreground/85 transition hover:text-foreground hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
