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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOptimizedUrl } from "@/lib/cloudinary";
import type { BusinessWithDetails } from "@/lib/queries/business";

function MobileSocialIcon({ type }: { type: "instagram" | "facebook" | "tiktok" }) {
  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="size-4 text-[#E1306C]" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="size-4 text-[#1877F2]" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.77a8.2 8.2 0 004.79 1.53V6.85a4.85 4.85 0 01-1.02-.16z" />
    </svg>
  );
}

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

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

interface MobileGalleryItem {
  id: string;
  thumbnailUrl: string;
  title: string | null;
  isVideo: boolean;
}

function getTodayDayOfWeek(): string {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return days[new Date().getDay()];
}

function formatTime(time: string) {
  return time.substring(0, 5);
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

function buildGalleryItems(business: BusinessWithDetails): MobileGalleryItem[] {
  const items = business.media
    .filter((media) => media.type !== "LOGO")
    .map((media) => {
      const isVideo = media.type === "PORTFOLIO_VIDEO";
      const cropMeta =
        !isVideo && media.cropX != null
          ? {
              x: media.cropX,
              y: media.cropY!,
              width: media.cropWidth!,
              height: media.cropHeight!,
            }
          : undefined;
      const thumbnailUrl =
        !isVideo && media.publicId
          ? getOptimizedUrl(media.publicId, { width: 640, crop: "limit" }, cropMeta)
          : media.url;

      return {
        id: media.id,
        thumbnailUrl,
        title: media.title,
        isVideo,
      };
    });

  if (items.length > 0) return items;

  if (business.coverImageUrl) {
    return [
      {
        id: "cover",
        thumbnailUrl: business.coverImageUrl,
        title: business.name,
        isVideo: false,
      },
    ];
  }

  return [];
}

function HeroImage({
  business,
  items,
}: {
  business: BusinessWithDetails;
  items: MobileGalleryItem[];
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

function PortfolioGrid({ items }: { items: MobileGalleryItem[] }) {
  if (items.length === 0) return null;

  const visible = items.slice(0, 9);
  const remaining = Math.max(items.length - visible.length, 0);

  return (
    <section id="portfolio" className="border-t px-5 py-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-bold tracking-normal">Portföy</h2>
        <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {visible.map((item, index) => (
          <div
            key={item.id}
            className="relative aspect-square overflow-hidden rounded-lg bg-muted"
          >
            {item.isVideo ? (
              <video
                src={item.thumbnailUrl}
                className="size-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <Image
                src={item.thumbnailUrl}
                alt={item.title ?? "Portföy görseli"}
                fill
                sizes="33vw"
                className="object-cover"
              />
            )}
            {index === visible.length - 1 && remaining > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/55 text-3xl font-bold text-background">
                +{remaining}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function HoursPreview({ business }: { business: BusinessWithDetails }) {
  if (business.hours.length === 0) return null;

  const today = getTodayDayOfWeek();
  const sorted = DAY_ORDER.map((day) =>
    business.hours.find((hour) => hour.dayOfWeek === day),
  ).filter(Boolean);

  return (
    <section id="hours" className="border-t px-5 py-8">
      <h2 className="mb-4 text-xl font-bold tracking-normal">Açılış saatleri</h2>
      <div className="space-y-1">
        {sorted.map((hour) => {
          if (!hour) return null;
          const isToday = hour.dayOfWeek === today;
          return (
            <div
              key={hour.dayOfWeek}
              className={cn(
                "flex items-center justify-between gap-4 rounded-md py-2 text-sm",
                isToday && "font-semibold",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "size-3 shrink-0 rounded-full bg-muted-foreground/35",
                    hour.isOpen && "bg-success-foreground",
                  )}
                />
                {DAY_LABELS[hour.dayOfWeek]}
              </span>
              <span className="shrink-0 text-right tabular-nums">
                {hour.isOpen && hour.openTime && hour.closeTime
                  ? `${formatTime(hour.openTime)} - ${formatTime(hour.closeTime)}`
                  : "Kapalı"}
              </span>
            </div>
          );
        })}
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
    <section id="services" className="border-t px-5 py-8">
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

function ReviewsPreview({
  business,
  reviewSummary,
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
}) {
  if (business.reviews.length === 0) return null;

  return (
    <section id="reviews" className="border-t px-5 py-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-normal">Değerlendirmeler</h2>
        {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            <Star className="size-4 fill-rating text-rating" />
            {reviewSummary.averageRating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {business.reviews.slice(0, 3).map((review) => {
          const name = [review.customer.firstName, review.customer.lastName]
            .filter(Boolean)
            .join(" ");
          return (
            <article key={review.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{name || "Müşteri"}</p>
                <span className="text-sm font-bold tabular-nums">
                  {(review.rating as number).toFixed(1)} / 10
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}
            </article>
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
    <div className="min-h-screen bg-background pb-28 lg:hidden">
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

      <nav className="sticky top-14 z-30 flex gap-5 overflow-x-auto border-b border-border/60 bg-background px-5 text-sm font-medium text-muted-foreground">
        {[
          ["#services", "Hizmetler"],
          ["#reviews", "Değerlendirmeler"],
          ["#portfolio", "Portföy"],
          ["#hours", "Diğer"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 border-b-2 border-transparent py-3 transition-colors hover:border-foreground hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

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

        {(business.description || business.instagramUrl || business.facebookUrl || business.tiktokUrl) && (
          <div id="about" className="mt-5 border-t pt-5">
            <h2 className="mb-2 text-base font-semibold tracking-normal">Hakkında</h2>
            {business.description && (
              <p className="line-clamp-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {business.description}
              </p>
            )}
            {(business.instagramUrl || business.facebookUrl || business.tiktokUrl) && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Bizi takip edin</p>
                <div className="flex flex-wrap gap-2">
                  {business.instagramUrl && (
                    <a
                      href={business.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                    >
                      <MobileSocialIcon type="instagram" />
                      Instagram
                    </a>
                  )}
                  {business.facebookUrl && (
                    <a
                      href={business.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                    >
                      <MobileSocialIcon type="facebook" />
                      Facebook
                    </a>
                  )}
                  {business.tiktokUrl && (
                    <a
                      href={business.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                    >
                      <MobileSocialIcon type="tiktok" />
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <ServicesPreview business={business} hrefPrefix={hrefPrefix} />

      <ReviewsPreview business={business} reviewSummary={reviewSummary} />
      <PortfolioGrid items={galleryItems} />
      <HoursPreview business={business} />

      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t bg-background/95 px-5 pb-[env(safe-area-inset-bottom,12px)] pt-3 shadow-lg backdrop-blur">
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
