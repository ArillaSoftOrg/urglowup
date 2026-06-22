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
  buildPortfolioItems,
} from "@/components/business-profile/business-gallery-hero";
import { MobileHeroGallery } from "@/components/business-profile/mobile-hero-gallery";
import { SectionNav, type NavSection } from "@/components/business-profile/section-nav";
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


function ServicesPreview({
  business,
  hrefPrefix = "",
}: {
  business: BusinessWithDetails;
  hrefPrefix?: string;
}) {
  const categories = business.categories.map((bc) => bc.category);

  return (
    <section id="services" className="scroll-mt-[106px] border-t px-5 py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-normal">Hizmetler</h2>
          {business.services.length > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {business.services.length} hizmet mevcut
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

      <div className="divide-y rounded-xl border bg-background shadow-sm">
        {business.services.slice(0, 5).map((service) => {
          const price = formatPrice(service);
          return (
            <Link
              key={service.id}
              href={`${hrefPrefix}/b/${business.slug}/book?service=${service.id}`}
              className="group flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/40 active:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold group-hover:text-primary">{service.name}</p>
                {service.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {service.durationMinutes} dk
                </p>
              </div>
              {price && (
                <span className="shrink-0 text-sm font-bold">{price}</span>
              )}
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
  const portfolioItems = buildPortfolioItems(business);
  const categories = business.categories.map((bc) => bc.category);
  const primaryCategory = categories[0]?.name;
  const hrefPrefix = locale && locale !== "tr" ? `/${locale}` : "";
  const addressQuery = [business.name, business.address, business.district, business.city]
    .filter(Boolean)
    .join(" ");

  const hasSocial = !!(business.instagramUrl || business.facebookUrl || business.tiktokUrl);
  const hasContact = !!(business.phone || business.whatsapp);
  const hasAbout = !!(business.description || hasContact || hasSocial || business.address || business.city || business.district);

  const navSections: NavSection[] = [
    ...(galleryItems.length > 0 ? [{ id: "gallery", label: "Fotoğraflar" }] : []),
    { id: "services", label: "Hizmetler" },
    ...(portfolioItems.length > 0 ? [{ id: "portfolio", label: "Portföy" }] : []),
    ...(hasAbout ? [{ id: "about", label: "Hakkında" }] : []),
    ...(business.hours.length > 0 ? [{ id: "hours", label: "Açılış Saatleri" }] : []),
    { id: "reviews", label: "Değerlendirmeler" },
  ];

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

      <SectionNav sections={navSections} />

      <section id="gallery" className="scroll-mt-[106px]">
        <MobileHeroGallery
          items={galleryItems}
          business={business}
          businessName={business.name}
        />
      </section>

      <section className="relative z-10 mx-4 -mt-8 rounded-[28px] bg-background px-5 pb-7 pt-8 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
        <h1 className="text-2xl font-bold leading-tight tracking-normal">
          {business.name}
        </h1>
        {primaryCategory && (
          <p className="mt-1 text-sm font-medium text-muted-foreground">{primaryCategory}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
          {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
            <>
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="size-3.5 fill-rating text-rating" />
                {reviewSummary.averageRating.toFixed(1)}
                <span className="font-normal text-muted-foreground">({reviewSummary.totalCount})</span>
              </span>
              <span aria-hidden className="text-muted-foreground/50">·</span>
            </>
          )}
          <span className={cn("inline-flex items-center gap-1 text-sm", !isOpen && "text-warning-foreground")}>
            <Clock className="size-3.5" />
            {isOpen ? "Açık" : getNextOpenLabel(business.hours)}
          </span>
        </div>

        {location && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-medium">{location}</span>
          </div>
        )}

        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
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
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <Navigation className="size-3.5" />
            Adres tarifi alın
          </a>
        )}

      </section>

      <ServicesPreview business={business} hrefPrefix={hrefPrefix} />

      <div className="space-y-8 px-5 py-8">
        <BusinessPortfolioSection items={portfolioItems} business={business} />
        <section id="about" className="scroll-mt-[106px]">
          <AboutSection business={business} />
        </section>
        <section id="hours" className="scroll-mt-[106px]">
          <HoursSection business={business} />
        </section>
        <section id="reviews" className="scroll-mt-[106px]">
          <ReviewsSection business={business} reviewSummary={reviewSummary} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t bg-background/95 px-5 pb-[env(safe-area-inset-bottom,12px)] pt-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/90 md:hidden">
        {business.services.length > 0 && (
          <p className="whitespace-nowrap text-sm text-muted-foreground">
            {business.services.length} hizmet mevcut
          </p>
        )}
        <Link
          href={`${hrefPrefix}/b/${business.slug}/book`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 shrink-0 rounded-full px-6 text-sm font-bold",
          )}
        >
          <CalendarCheck className="size-4" />
          Hemen randevu al
        </Link>
      </div>
    </div>
  );
}
