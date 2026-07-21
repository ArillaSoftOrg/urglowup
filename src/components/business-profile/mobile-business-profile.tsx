import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  MapPin,
  Star,
} from "lucide-react";
import { ShareFavoriteButtons } from "@/components/business-profile/share-favorite-buttons";
import { AboutSection } from "@/components/business-profile/about-section";
import {
  buildGalleryItems,
  buildPortfolioItems,
} from "@/components/business-profile/business-gallery-hero";
import { MobileHeroGallery } from "@/components/business-profile/mobile-hero-gallery";
import { MobileServicesPreview } from "@/components/business-profile/mobile-services-preview";
import { SectionNav, type NavSection } from "@/components/business-profile/section-nav";
import { BusinessPortfolioSection } from "@/components/business-profile/business-portfolio-section";
import { HoursSection } from "@/components/business-profile/hours-section";
import { LocationSection } from "@/components/business-profile/location-section";
import { TeamSection } from "@/components/business-profile/team-section";
import { buttonVariants } from "@/components/ui/button";
import {
  PublicAccountMenu,
  type PublicAccountMenuLabels,
} from "@/components/layout/public-account-menu";
import type { PublicAccountMenuState } from "@/components/layout/public-account-menu-state";
import { cn } from "@/lib/utils";
import type { BusinessWithDetails } from "@/lib/queries/business";
import type { BusinessMediaEngagement } from "@/lib/queries/business";

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

function ClosedStatusText({ label }: { label: string }) {
  const [status, ...rest] = label.split(" · ");
  const restText = rest.join(" · ");

  return (
    <>
      <span className="text-warning-foreground">{status}</span>
      {restText && (
        <>
          <span className="text-muted-foreground"> - </span>
          <span className="text-muted-foreground">{restText}</span>
        </>
      )}
    </>
  );
}

export function MobileBusinessProfile({
  business,
  reviewSummary,
  isOpen,
  location,
  locale,
  accountMenuState,
  accountMenuLabels,
  isLoggedIn = false,
  initialIsFavorited = false,
  mediaEngagement = {},
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
  isOpen: boolean;
  location: string;
  locale?: string;
  accountMenuState: PublicAccountMenuState;
  accountMenuLabels: PublicAccountMenuLabels;
  isLoggedIn?: boolean;
  initialIsFavorited?: boolean;
  mediaEngagement?: Record<string, BusinessMediaEngagement>;
}) {
  const galleryItems = buildGalleryItems(business);
  const portfolioItems = buildPortfolioItems(business, mediaEngagement);
  const categories = business.categories.map((bc) => bc.category);
  const primaryCategory = categories[0]?.name;
  const hrefPrefix = locale && locale !== "tr" ? `/${locale}` : "";
  const hasSocial = !!(business.instagramUrl || business.facebookUrl || business.tiktokUrl);
  const hasContact = !!(business.phone || business.whatsapp);
  const hasAbout = !!(business.description || hasContact || hasSocial || business.address || business.city || business.district);
  const hasTeam = business.professionals.length > 0;
  const navSections: NavSection[] = [
    ...(galleryItems.length > 0 ? [{ id: "gallery", label: "Fotoğraflar" }] : []),
    ...(hasAbout ? [{ id: "about", label: "Hakkında" }] : []),
    { id: "services", label: "Hizmetler" },
    ...(hasTeam ? [{ id: "team", label: "Ekip" }] : []),
    ...(portfolioItems.length > 0 ? [{ id: "portfolio", label: "Portföy" }] : []),
    { id: "hours", label: "Saatler" },
    { id: "location", label: "Harita" },
    { id: "other", label: "Diğer" },
  ];

  return (
    <div className="min-h-screen bg-surface-cream md:hidden">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
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
          <ShareFavoriteButtons
            businessId={business.id}
            businessName={business.name}
            businessSlug={business.slug}
            initialIsFavorited={initialIsFavorited}
            isLoggedIn={isLoggedIn}
            variant="mobile"
          />
          <PublicAccountMenu
            state={accountMenuState}
            labels={accountMenuLabels}
            className="h-10 px-3 text-sm"
          />
        </div>
      </header>
      {/* Spacer to push content below the fixed header */}
      <div aria-hidden className="h-14" />

      <section id="gallery" className="scroll-mt-[106px]">
        <MobileHeroGallery
          items={galleryItems}
          business={business}
          businessName={business.name}
        />
      </section>

      <main className="relative z-10 -mt-10 rounded-t-[30px] bg-background shadow-lg">
        <section className="px-5 pb-5 pt-7">
          <h1 className="text-2xl font-bold leading-tight tracking-normal">
            {business.name}
          </h1>
          {primaryCategory && (
            <p className="mt-1 text-sm font-medium text-muted-foreground">{primaryCategory}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
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
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                isOpen && "text-success-foreground",
              )}
            >
              <Clock className={cn("size-3.5", !isOpen && "text-warning-foreground")} />
              {isOpen ? "Açık" : <ClosedStatusText label={getNextOpenLabel(business.hours)} />}
            </span>
          </div>

          {location && (
            <a
              href="#location"
              className="mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <MapPin className="size-3.5 shrink-0 fill-foreground text-foreground" />
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{location}</span>
            </a>
          )}

        </section>

        <SectionNav
          sections={navSections}
          initialActiveId="about"
          revealAtId="about"
          className="border-t bg-background/95 md:hidden"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const nav = document.querySelector('[data-mobile-section-nav="true"]');
                const target = document.getElementById('about');
                if (!nav || !target) return;
                const sync = () => {
                  const show = window.scrollY > 0 && target.getBoundingClientRect().top <= 120;
                  nav.style.visibility = show ? 'visible' : 'hidden';
                  nav.style.opacity = show ? '1' : '0';
                  nav.style.pointerEvents = show ? 'auto' : 'none';
                  if (!show) return;
                  let current = 'about';
                  nav.querySelectorAll('[data-section-id]').forEach((button) => {
                    const id = button.getAttribute('data-section-id');
                    const section = id ? document.getElementById(id) : null;
                    if (section && section.getBoundingClientRect().top <= 120) current = id;
                  });
                  nav.querySelectorAll('[data-section-id]').forEach((button) => {
                    const active = button.getAttribute('data-section-id') === current;
                    button.setAttribute('aria-current', active ? 'true' : 'false');
                    button.classList.toggle('text-foreground', active);
                    button.classList.toggle('after:scale-x-100', active);
                    button.classList.toggle('text-foreground/65', !active);
                    button.classList.toggle('after:scale-x-0', !active);
                    button.classList.toggle('hover:text-foreground', !active);
                  });
                };
                window.addEventListener('scroll', sync, { passive: true });
                window.addEventListener('resize', sync);
                sync();
              })();
            `,
          }}
        />

        {hasAbout && (
          <section id="about" className="scroll-mt-[106px]">
            <div className="px-5 pt-5">
              <AboutSection
                business={business}
                showLocation={false}
                showTopBorder={false}
                inlineReadMore
              />
            </div>
          </section>
        )}

        <MobileServicesPreview business={business} hrefPrefix={hrefPrefix} />

        <div className="space-y-8 px-5 pb-0">
          <TeamSection business={business} hrefPrefix={hrefPrefix} />
          <BusinessPortfolioSection
            items={portfolioItems}
            business={business}
            isLoggedIn={isLoggedIn}
          />
          <section className="space-y-8">
            <section id="hours" className="scroll-mt-[122px]">
              <HoursSection business={business} />
            </section>
            <section id="location" className="scroll-mt-[122px]">
              <LocationSection business={business} />
            </section>
          </section>
        </div>
      </main>

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
            "h-11 shrink-0 rounded-full bg-foreground px-6 text-sm font-bold text-background shadow-lg shadow-foreground/15 hover:bg-foreground/90",
          )}
        >
          <CalendarCheck className="size-4" />
          Hemen randevu al
        </Link>
      </div>
    </div>
  );
}
