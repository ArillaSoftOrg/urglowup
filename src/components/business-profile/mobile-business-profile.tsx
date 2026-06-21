import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Share2,
  Star,
} from "lucide-react";
import { AboutSection } from "@/components/business-profile/about-section";
import {
  buildGalleryItems,
  type GalleryItem,
} from "@/components/business-profile/business-gallery-hero";
import { BusinessPortfolioSection } from "@/components/business-profile/business-portfolio-section";
import { HoursSection } from "@/components/business-profile/hours-section";
import { ReviewsSection } from "@/components/business-profile/reviews-section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BusinessWithDetails } from "@/lib/queries/business";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Pazartesi",
  TUESDAY: "Salı",
  WEDNESDAY: "Çarşamba",
  THURSDAY: "Perşembe",
  FRIDAY: "Cuma",
  SATURDAY: "Cumartesi",
  SUNDAY: "Pazar",
};

interface ReviewSummary {
  averageRating: number | null;
  totalCount: number;
}

function formatPrice(service: BusinessWithDetails["services"][number]) {
  if (service.priceType === "FREE_CONSULTATION") return "Ücretsiz danışma";
  if (service.priceType === "CONSULTATION_REQUIRED") return "Fiyat için danışın";
  if (!service.price) return null;

  const amount = `₺${Number(service.price)}`;
  return service.priceType === "STARTS_FROM" ? `${amount} itibaren` : amount;
}

const JS_TO_DAY = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function getNextOpenLabel(hours: BusinessWithDetails["hours"]): string {
  const now = new Date();
  const todayJs = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  for (let i = 0; i <= 7; i++) {
    const nextJs = (todayJs + i) % 7;
    const dayName = JS_TO_DAY[nextJs];
    const h = hours.find((hr) => hr.dayOfWeek === dayName);
    if (!h?.isOpen || !h.openTime) continue;
    if (i === 0 && h.openTime <= currentTime) continue;

    const time = h.openTime.substring(0, 5).replace(":", ".");
    if (i === 0) return `Kapalı · Bugün ${time}'da açılacak`;
    if (i === 1) return `Kapalı · Yarın ${time}'da açılacak`;
    return `Kapalı · ${DAY_LABELS[dayName]} ${time}'da açılacak`;
  }
  return "Kapalı";
}

function HeroImage({
  business,
  items,
}: {
  business: BusinessWithDetails;
  items: GalleryItem[];
}) {
  const hero = items[0];

  return (
    <section className="px-4 pt-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        {hero ? (
          hero.isVideo ? (
            <video
              src={hero.thumbnailUrl}
              className="size-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={hero.thumbnailUrl}
              alt={hero.title ?? business.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          )
        ) : (
          <div className="size-full bg-surface-cream" />
        )}

        {items.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-foreground/75 px-3 py-1 text-sm font-bold text-background">
            1/{items.length}
          </div>
        )}
      </div>
    </section>
  );
}

function ServicesPreview({
  business,
  hrefPrefix = "",
}: {
  business: BusinessWithDetails;
  hrefPrefix?: string;
}) {
  const categories = business.categories.map((bc) => bc.category);

  return (
    <section id="services" className="scroll-mt-28 border-t px-5 py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-normal">Hizmetler</h2>
          {business.services.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              mevcut {business.services.length} hizmet
            </p>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Öne Çıkanlar
          </span>
          {categories.map((category) => (
            <span
              key={category.id}
              className="inline-flex h-9 shrink-0 items-center rounded-full border bg-background px-4 text-sm font-medium"
            >
              {category.name}
            </span>
          ))}
        </div>
      )}

      <div className="divide-y rounded-lg border bg-background">
        {business.services.slice(0, 5).map((service) => {
          const price = formatPrice(service);
          return (
            <Link
              key={service.id}
              href={`${hrefPrefix}/b/${business.slug}/book?service=${service.id}`}
              className="block px-4 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold">{service.name}</p>
                  {service.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {service.durationMinutes} dk
                  </p>
                </div>
                {price && (
                  <span className="shrink-0 text-sm font-bold">{price}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function MobileBusinessProfile({
  business,
  reviewSummary,
  isOpen,
  location,
  locale,
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
  isOpen: boolean;
  location: string;
  locale?: string;
}) {
  const galleryItems = buildGalleryItems(business);
  const categories = business.categories.map((bc) => bc.category);
  const primaryCategory = categories[0]?.name;
  const hrefPrefix = locale && locale !== "tr" ? `/${locale}` : "";
  const addressQuery = [business.name, business.address, business.district, business.city]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-background pb-24 md:hidden">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <Link
          href={hrefPrefix || "/"}
          aria-label="Geri dön"
          className="inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <p className="min-w-0 flex-1 truncate px-2 text-lg font-bold">
          {business.name}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Paylaş"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"
          >
            <Share2 className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Favorilere ekle"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"
          >
            <Heart className="size-5" />
          </button>
        </div>
      </header>

      <HeroImage business={business} items={galleryItems} />

      <section className="relative z-10 mx-4 -mt-8 rounded-[28px] bg-background px-5 pb-7 pt-8 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
        <h1 className="text-3xl font-bold leading-tight tracking-normal">
          {business.name}
        </h1>
        {primaryCategory && (
          <p className="mt-1 text-base text-muted-foreground">{primaryCategory}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
            <>
              <span className="inline-flex items-center gap-1 font-bold">
                <Star className="size-4 fill-rating text-rating" />
                {reviewSummary.averageRating.toFixed(1)}
                <span className="text-primary">({reviewSummary.totalCount})</span>
              </span>
              <span aria-hidden className="text-muted-foreground">·</span>
            </>
          )}
          <span className={cn("inline-flex items-center gap-1", !isOpen && "text-warning-foreground")}>
            <Clock className="size-4" />
            {isOpen ? "Açık" : getNextOpenLabel(business.hours)}
          </span>
        </div>

        {location && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-medium">
            <MapPin className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{location}</span>
          </div>
        )}

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category.id} variant="neutral">
                {category.name}
              </Badge>
            ))}
          </div>
        )}

        {addressQuery && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary"
          >
            <Navigation className="size-4" />
            Adres tarifi alın
          </a>
        )}

      </section>

      <ServicesPreview business={business} hrefPrefix={hrefPrefix} />

      <div className="space-y-8 px-5 py-8">
        <BusinessPortfolioSection items={galleryItems} business={business} />
        <section id="about">
          <AboutSection business={business} />
        </section>
        <section id="hours">
          <HoursSection business={business} />
        </section>
        <section id="reviews">
          <ReviewsSection business={business} reviewSummary={reviewSummary} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t bg-background/95 px-5 pb-[env(safe-area-inset-bottom,12px)] pt-3 shadow-lg backdrop-blur md:hidden">
        {business.services.length > 0 && (
          <p className="whitespace-nowrap text-sm text-muted-foreground">
            mevcut {business.services.length} hizmet
          </p>
        )}
        <Link
          href={`${hrefPrefix}/b/${business.slug}/book`}
          className={cn(
            buttonVariants({ size: "default" }),
            "shrink-0 rounded-full px-5 font-bold",
          )}
        >
          <CalendarCheck className="size-4" />
          Rezervasyon yap
        </Link>
      </div>
    </div>
  );
}
