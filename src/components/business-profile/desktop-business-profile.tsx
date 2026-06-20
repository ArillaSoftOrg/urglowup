import Link from "next/link";
import {
  ChevronDown,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Share2,
  Star,
} from "lucide-react";
import { AboutSection } from "@/components/business-profile/about-section";
import {
  BusinessGalleryHero,
  buildGalleryItems,
} from "@/components/business-profile/business-gallery-hero";
import { BusinessPortfolioSection } from "@/components/business-profile/business-portfolio-section";
import { ContactSidebar } from "@/components/business-profile/contact-sidebar";
import { HoursSection } from "@/components/business-profile/hours-section";
import { LocationSection } from "@/components/business-profile/location-section";
import { ProfileSearchHeader } from "@/components/business-profile/profile-search-header";
import { ReviewsSection } from "@/components/business-profile/reviews-section";
import { ServicesSection } from "@/components/business-profile/services-section";
import { cn } from "@/lib/utils";
import type { BusinessWithDetails, GoogleReview } from "@/lib/queries/business";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Pazartesi",
  TUESDAY: "Salı",
  WEDNESDAY: "Çarşamba",
  THURSDAY: "Perşembe",
  FRIDAY: "Cuma",
  SATURDAY: "Cumartesi",
  SUNDAY: "Pazar",
};

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
      <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-8 px-5 sm:px-6 lg:px-10 xl:px-12">
        <Link
          href={pathWithLocale("/", locale)}
          className="flex w-44 shrink-0 items-center transition-opacity hover:opacity-80"
        >
          <span className="text-[26px] font-bold leading-none tracking-normal">UrGlowUp</span>
        </Link>

        <ProfileSearchHeader locale={locale} />

        <div className="flex w-auto shrink-0 items-center justify-end gap-3 lg:w-64 lg:gap-4">
          <Link
            href="/business/dashboard"
            className="hidden text-sm font-semibold text-muted-foreground transition hover:text-foreground lg:block"
          >
            İşletme Paneliniz
          </Link>

          <button
            type="button"
            aria-label="Hesap menüsü"
            className="flex h-10 items-center gap-2 rounded-full border bg-background px-2.5 shadow-sm lg:h-11 lg:gap-3 lg:px-3"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-sm font-bold lg:size-8">
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
    <nav className="flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
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
      <div className="min-w-0 space-y-3">
        <h1 className="text-[28px] font-bold leading-none tracking-normal lg:text-[44px]">
          {business.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-base text-muted-foreground lg:text-lg">
          {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
            <>
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="font-bold">{reviewSummary.averageRating.toFixed(1)}</span>
                <span className="flex text-rating">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className="size-4 fill-rating text-rating"
                    />
                  ))}
                </span>
                <span className="font-medium text-primary">
                  ({reviewSummary.totalCount})
                </span>
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className={cn("inline-flex items-center gap-1.5", !isOpen && "text-warning-foreground")}>
            <Clock className="size-4" />
            {isOpen ? "Açık" : getNextOpenLabel(business.hours)}
          </span>
          {location && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
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
                <Navigation className="size-4" />
                Adres tarifi alın
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Paylaş"
          className="flex size-13 items-center justify-center rounded-full border bg-background shadow-sm transition hover:bg-muted"
        >
          <Share2 className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Favorilere ekle"
          className="flex size-13 items-center justify-center rounded-full border bg-background shadow-sm transition hover:bg-muted"
        >
          <Heart className="size-5" />
        </button>
      </div>
    </div>
  );
}

function DesktopSectionNav() {
  const items = [
    ["#services", "Hizmetler"],
    ["#portfolio", "Portföy"],
    ["#about", "Hakkında"],
    ["#reviews", "Değerlendirmeler"],
    ["#hours", "Açılış saatleri"],
    ["#location", "Konum"],
  ] as const;

  return (
    <nav className="sticky top-0 z-20 border-y bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] gap-8 overflow-x-auto px-5 text-[15px] font-bold sm:px-6 lg:px-10 xl:px-12">
        {items.map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 border-b-2 border-transparent py-4 hover:border-foreground"
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
  const galleryItems = buildGalleryItems(business);

  return (
    <div className="hidden bg-background md:block">
      <DesktopSearchHeader locale={locale} />

      <div className="mx-auto max-w-[1440px] space-y-5 px-5 pb-8 pt-6 sm:px-6 lg:space-y-6 lg:px-10 lg:pt-7 xl:px-12">
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

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:px-10 lg:py-10 xl:px-12">
        <div className="min-w-0 space-y-9">
          <ServicesSection business={business} />
          <BusinessPortfolioSection items={galleryItems} business={business} />
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
