import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Clock,
  MapPin,
  Star,
} from "lucide-react";
import Link from "next/link";
import type { BusinessWithDetails } from "@/lib/queries/business";

interface ReviewSummary {
  averageRating: number | null;
  totalCount: number;
}

export function ContactSidebar({
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
  const hrefPrefix = locale && locale !== "tr" ? `/${locale}` : "";
  const addressQuery = [business.name, business.address, business.district, business.city]
    .filter(Boolean)
    .join(" ");
  const fullAddress = [business.address, business.district, business.city]
    .filter(Boolean)
    .join(", ");
  const addressLabel = fullAddress || location;
  const todayHours = business.hours.find((hour) => {
    const dayNames = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ] as const;

    return hour.dayOfWeek === dayNames[new Date().getDay()];
  });
  const hoursLabel =
    todayHours?.isOpen && todayHours.openTime && todayHours.closeTime
      ? `${todayHours.openTime.slice(0, 5)} - ${todayHours.closeTime.slice(0, 5)}`
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm lg:sticky lg:top-[76px]">
      <div className="space-y-6 p-7">
        <h2 className="text-[32px] font-bold leading-tight tracking-normal">
          {business.name}
        </h2>

        {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
          <div className="flex flex-wrap items-center gap-2 text-[22px] leading-none">
            <span className="font-bold">
              {reviewSummary.averageRating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1 text-rating" aria-hidden>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className="size-6 fill-rating text-rating"
                />
              ))}
            </span>
            <span className="font-medium text-primary">
              ({reviewSummary.totalCount})
            </span>
          </div>
        )}

        <Link
          href={`${hrefPrefix}/b/${business.slug}/book`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "inline-flex h-[60px] w-full items-center justify-center rounded-full px-6 text-center text-lg font-bold whitespace-nowrap",
          )}
        >
          Rezervasyon yap
        </Link>
      </div>

      {(business.hours.length > 0 || addressLabel) && (
        <div className="space-y-5 border-t border-border/70 p-7 text-lg leading-relaxed">
          {business.hours.length > 0 && (
            <div className="flex items-start gap-3">
              <Clock className="mt-1 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "font-semibold",
                    isOpen ? "text-success-foreground" : "text-warning-foreground",
                  )}
                >
                  {isOpen ? "Açık" : "Kapalı"}
                </span>
                {hoursLabel && (
                  <span className="font-medium text-foreground">
                    {" "}
                    - bugün {hoursLabel}
                  </span>
                )}
              </div>
              <ChevronDown className="mt-1.5 size-4 shrink-0" />
            </div>
          )}

          {addressLabel && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-5 shrink-0" />
              <p className="min-w-0 flex-1 font-medium text-foreground">
                {addressLabel}
                {addressQuery && (
                  <>
                    {" "}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      Yol tarifi alın
                    </a>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
