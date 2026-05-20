import { Fragment } from "react";
import { Star, MapPin, Scissors } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { isBusinessOpen } from "./hours-section";

interface ReviewSummary {
  averageRating: number | null;
  totalCount: number;
}

interface QuickInfoBarProps {
  hours: BusinessWithDetails["hours"];
  reviewSummary: ReviewSummary;
  city: string | null;
  district: string | null;
  serviceCount: number;
}

export function QuickInfoBar({
  hours,
  reviewSummary,
  city,
  district,
  serviceCount,
}: QuickInfoBarProps) {
  const open = hours.length > 0 ? isBusinessOpen(hours) : null;
  const location = [district, city].filter(Boolean).join(", ");

  const chips = [
    open !== null && (
      <span key="open" className="flex items-center gap-1.5">
        <span
          className={`inline-block size-2 rounded-full ${open ? "bg-green-500" : "bg-muted-foreground/40"}`}
        />
        <span className={open ? "font-medium text-green-700" : ""}>
          {open ? "Şu an açık" : "Kapalı"}
        </span>
      </span>
    ),
    reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
      <span key="rating" className="flex items-center gap-1">
        <Star className="size-3.5 fill-amber-400 text-amber-400" />
        <span className="font-medium text-foreground">
          {reviewSummary.averageRating.toFixed(1)}
        </span>
        <span>({reviewSummary.totalCount} değerlendirme)</span>
      </span>
    ),
    location && (
      <span key="location" className="flex items-center gap-1">
        <MapPin className="size-3.5 shrink-0" />
        {location}
      </span>
    ),
    serviceCount > 0 && (
      <span key="services" className="flex items-center gap-1">
        <Scissors className="size-3.5 shrink-0" />
        {serviceCount} hizmet
      </span>
    ),
  ].filter(Boolean) as React.ReactNode[];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
      {chips.map((chip, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="text-muted-foreground/40" aria-hidden>
              ·
            </span>
          )}
          {chip}
        </Fragment>
      ))}
    </div>
  );
}
