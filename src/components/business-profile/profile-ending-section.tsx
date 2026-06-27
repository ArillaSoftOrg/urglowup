import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

function pathWithLocale(path: string, locale?: string) {
  return locale && locale !== "tr" ? `/${locale}${path}` : path;
}

const DISCOVERY_LINKS = [
  { label: "Erkek Saç Kesimleri", categorySlug: "barber-shop" },
  { label: "Saç Şekillendirme", categorySlug: "hair-salon" },
  { label: "Çocuk Saç Kesimleri", categorySlug: "barber-shop" },
  { label: "Kuaför Salonları", categorySlug: "hair-salon" },
  { label: "Kaş Şekillendirme", categorySlug: "eyebrow-lash" },
  { label: "Manikür", categorySlug: "nail-salon" },
  { label: "Berberler", categorySlug: "barber-shop" },
  { label: "Pedikür", categorySlug: "nail-salon" },
  { label: "Tırnak Salonları", categorySlug: "nail-salon" },
  { label: "Güzellik Salonları", categorySlug: "skin-care" },
  { label: "Jel Tırnaklar", categorySlug: "nail-salon" },
  { label: "Saç Boyama", categorySlug: "hair-salon" },
];

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
      className="group block min-w-[216px] flex-[0_0_56%] snap-start md:min-w-0 md:flex-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-cream shadow-sm">
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
        <span className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-foreground/40 text-background shadow-sm backdrop-blur">
          <Heart className="size-5" />
        </span>
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-bold leading-tight tracking-normal text-foreground">
            {business.name}
          </h3>
          {business.reviewAvg !== null && business.reviewCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold leading-none">
              <Star className="size-3.5 fill-rating text-rating" />
              {(business.reviewAvg / 2).toFixed(1)}
            </span>
          )}
        </div>
        {location && <p className="line-clamp-1 text-sm leading-tight text-muted-foreground">{location}</p>}
        {(category || business.reviewCount > 0) && (
          <p className="line-clamp-1 text-sm leading-tight text-muted-foreground">
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
  const discoveryLinks = DISCOVERY_LINKS.map(({ label, categorySlug }) => ({
    label,
    href: pathWithLocale(`/category/${categorySlug}${business.city ? `/${encodeURIComponent(business.city)}` : ""}`, locale),
  }));

  if (nearbyBusinesses.length === 0 && links.length === 0 && discoveryLinks.length === 0) return null;

  return (
    <section id="other" className="scroll-mt-[106px] border-t border-border/70 bg-background md:border-t">
      <div className="mx-auto max-w-[1440px] space-y-12 px-5 py-7 sm:px-6 md:space-y-14 md:py-12 lg:px-10 lg:py-14 xl:px-12">
        {nearbyBusinesses.length > 0 && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-xl font-bold tracking-normal md:text-2xl">
              Yakındaki mekanlar
            </h2>
            <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
              {nearbyBusinesses.slice(0, 4).map((item) => (
                <NearbyBusinessCard key={item.id} business={item} locale={locale} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 md:space-y-7">
          <h2 className="max-w-[340px] text-[22px] font-bold leading-tight tracking-normal text-foreground md:max-w-4xl md:text-3xl lg:text-[34px]">
            İstediğiniz zaman, istediğiniz yerde kendinizi şımartın
          </h2>
          {business.city && (
            <Link
              href={pathWithLocale(`/city/${encodeURIComponent(business.city)}`, locale)}
              className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-bold text-background transition hover:bg-foreground/90 md:h-12 md:px-5 md:text-base"
            >
              Diğer işletmeler {city}
            </Link>
          )}
          {discoveryLinks.length > 0 && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-1 text-[13px] leading-none sm:text-sm md:hidden">
              {discoveryLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="font-medium text-foreground transition hover:text-foreground/80"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
          {links.length > 0 && (
            <div className="hidden gap-x-16 gap-y-4 pt-2 text-base md:grid md:grid-cols-2 lg:grid-cols-3">
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
