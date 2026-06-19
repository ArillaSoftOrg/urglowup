import Link from "next/link";
import {
  ChevronDown,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Search,
  Share2,
  Star,
} from "lucide-react";
import { AboutSection } from "@/components/business-profile/about-section";
import { BusinessGalleryHero } from "@/components/business-profile/business-gallery-hero";
import { ContactSidebar } from "@/components/business-profile/contact-sidebar";
import { HoursSection } from "@/components/business-profile/hours-section";
import { LocationSection } from "@/components/business-profile/location-section";
import { ReviewsSection } from "@/components/business-profile/reviews-section";
import { ServicesSection } from "@/components/business-profile/services-section";
import { cn } from "@/lib/utils";
import type { BusinessWithDetails, GoogleReview } from "@/lib/queries/business";

interface ReviewSummary {
  averageRating: number | null;
  totalCount: number;
}

function pathWithLocale(path: string, locale?: string) {
  return locale && locale !== "tr" ? `/${locale}${path}` : path;
}

function DesktopSearchHeader({ locale }: { locale?: string }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-24 max-w-[1800px] items-center gap-8 px-6">
        <Link
          href={pathWithLocale("/", locale)}
          className="flex w-44 shrink-0 items-center transition-opacity hover:opacity-80"
        >
          <span className="text-[28px] font-bold leading-none tracking-normal">UrGlowUp</span>
        </Link>

        <div className="mx-auto grid h-16 w-full max-w-[900px] grid-cols-[1fr_1fr_1fr_auto] items-center overflow-hidden rounded-full border bg-background shadow-md">
          <button
            type="button"
            className="h-full border-r px-6 text-left text-base font-medium hover:bg-muted/50"
          >
            Tüm işlemler
          </button>
          <button
            type="button"
            className="h-full border-r px-6 text-left text-base font-medium hover:bg-muted/50"
          >
            Mevcut konum
          </button>
          <button
            type="button"
            className="h-full px-6 text-left text-base font-medium hover:bg-muted/50"
          >
            Herhangi bir zaman
          </button>
          <button
            type="button"
            aria-label="Ara"
            className="mr-2 flex size-12 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90"
          >
            <Search className="size-5" />
          </button>
        </div>

        <div className="flex w-64 shrink-0 items-center justify-end gap-4">
          <Link
            href="/business/dashboard"
            className="text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            İşletme Paneliniz
          </Link>

          <button
            type="button"
            aria-label="Hesap menüsü"
            className="flex h-12 items-center gap-3 rounded-full border bg-background px-3 shadow-sm"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-bold">
              U
            </span>
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function DesktopBreadcrumbs({
  business,
  locale,
}: {
  business: BusinessWithDetails;
  locale?: string;
}) {
  const primaryCategory = business.categories[0]?.category;

  return (
    <nav className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
      <Link href={pathWithLocale("/", locale)} className="hover:text-foreground">
        Ana Sayfa
      </Link>
      <span aria-hidden>·</span>
      {primaryCategory && (
        <>
          <Link
            href={pathWithLocale(`/category/${primaryCategory.slug}`, locale)}
            className="hover:text-foreground"
          >
            {primaryCategory.name}
          </Link>
          <span aria-hidden>·</span>
        </>
      )}
      {business.city && (
        <>
          <Link
            href={pathWithLocale(`/city/${encodeURIComponent(business.city)}`, locale)}
            className="hover:text-foreground"
          >
            {business.city}
          </Link>
          <span aria-hidden>·</span>
        </>
      )}
      <span className="font-bold text-foreground">{business.name}</span>
    </nav>
  );
}

function DesktopTitleBlock({
  business,
  reviewSummary,
  isOpen,
  location,
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
  isOpen: boolean;
  location: string;
}) {
  const addressQuery = [business.name, business.address, business.district, business.city]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-end justify-between gap-8">
      <div className="min-w-0 space-y-4">
        <h1 className="text-[56px] font-bold leading-none tracking-normal">
          {business.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xl text-muted-foreground">
          {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null ? (
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="font-bold">{reviewSummary.averageRating.toFixed(1)}</span>
              <span className="flex text-rating">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="size-5 fill-rating text-rating"
                  />
                ))}
              </span>
              <span className="font-medium text-primary">
                ({reviewSummary.totalCount})
              </span>
            </span>
          ) : (
            <span>Henüz yorum yok</span>
          )}
          <span aria-hidden>·</span>
          <span className={cn("inline-flex items-center gap-1.5", !isOpen && "text-warning-foreground")}>
            <Clock className="size-5" />
            {isOpen ? "Açık" : "Kapalı"}
          </span>
          {location && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-5" />
                {location}
              </span>
            </>
          )}
          {addressQuery && (
            <>
              <span aria-hidden>·</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-foreground hover:underline"
              >
                <Navigation className="size-5" />
                Yol tarifi al
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          aria-label="Paylaş"
          className="flex size-15 items-center justify-center rounded-full border bg-background shadow-sm transition hover:bg-muted"
        >
          <Share2 className="size-6" />
        </button>
        <button
          type="button"
          aria-label="Favorilere ekle"
          className="flex size-15 items-center justify-center rounded-full border bg-background shadow-sm transition hover:bg-muted"
        >
          <Heart className="size-6" />
        </button>
      </div>
    </div>
  );
}

function DesktopSectionNav() {
  const items = [
    ["#services", "Hizmetler"],
    ["#about", "Hakkında"],
    ["#reviews", "Değerlendirmeler"],
    ["#hours", "Açılış saatleri"],
    ["#location", "Konum"],
  ] as const;

  return (
    <nav className="sticky top-0 z-20 border-y bg-background/95 px-6 backdrop-blur">
      <div className="mx-auto flex max-w-[1800px] gap-8 overflow-x-auto text-base font-bold">
        {items.map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 border-b-2 border-transparent py-5 hover:border-foreground"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function DesktopBusinessProfile({
  business,
  reviewSummary,
  googleReviews,
  isOpen,
  location,
  locale,
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
  googleReviews?: GoogleReview[];
  isOpen: boolean;
  location: string;
  locale?: string;
}) {
  return (
    <div className="hidden bg-background lg:block">
      <DesktopSearchHeader locale={locale} />

      <div className="mx-auto max-w-[1800px] space-y-8 px-6 pb-10 pt-10">
        <DesktopBreadcrumbs business={business} locale={locale} />
        <DesktopTitleBlock
          business={business}
          reviewSummary={reviewSummary}
          isOpen={isOpen}
          location={location}
        />
        <BusinessGalleryHero business={business} />
      </div>

      <DesktopSectionNav />

      <div className="mx-auto grid max-w-[1800px] grid-cols-[minmax(0,1fr)_380px] gap-10 px-6 py-10">
        <div className="min-w-0 space-y-9">
          <ServicesSection business={business} />
          <section id="about">
            <AboutSection business={business} />
          </section>
          <section id="hours">
            <HoursSection business={business} />
          </section>
          <section id="reviews">
            <ReviewsSection
              business={business}
              reviewSummary={reviewSummary}
              googleReviews={googleReviews}
            />
          </section>
          <section id="location">
            <LocationSection business={business} />
          </section>
        </div>

        <aside>
          <ContactSidebar
            business={business}
            reviewSummary={reviewSummary}
            locale={locale}
          />
        </aside>
      </div>
    </div>
  );
}
