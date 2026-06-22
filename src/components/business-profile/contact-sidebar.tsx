import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
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
  locale,
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
  locale?: string;
}) {
  const hrefPrefix = locale && locale !== "tr" ? `/${locale}` : "";

  return (
    <div className="rounded-xl border border-border/70 bg-background p-5 shadow-sm lg:sticky lg:top-[76px]">
      <div className="space-y-4">
        <h2 className="text-xl font-bold leading-tight tracking-normal">Randevu al</h2>

        {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
          <div className="flex items-center gap-2 text-sm">
            <Star className="size-4 fill-rating text-rating" />
            <span className="font-semibold">
              {reviewSummary.averageRating.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              {reviewSummary.totalCount} yorum
            </span>
          </div>
        )}

        <Link
          href={`${hrefPrefix}/b/${business.slug}/book`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-13 w-full gap-2 rounded-full text-base font-bold",
          )}
        >
          <CalendarCheck className="size-4" />
          Hemen randevu al
        </Link>
      </div>
    </div>
  );
}
