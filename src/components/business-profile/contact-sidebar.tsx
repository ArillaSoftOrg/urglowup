import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  ExternalLink,
  MessageCircle,
  Phone,
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
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
}) {
  return (
    <div className="sticky top-24 overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="space-y-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">Randevu</p>
          <h2 className="mt-1 text-xl font-bold tracking-normal">
            {business.name}
          </h2>
        </div>

        {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">
              {reviewSummary.averageRating.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              {reviewSummary.totalCount} yorum
            </span>
          </div>
        )}

        <Link
          href={`/b/${business.slug}/book`}
          className={cn(buttonVariants({ size: "lg" }), "h-12 w-full gap-2 rounded-full")}
        >
          <CalendarCheck className="size-4" />
          Randevu al
        </Link>
      </div>

      {(business.phone || business.whatsapp || business.instagramUrl) && (
        <div className="space-y-2 border-t bg-muted/20 p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Iletisim
          </p>
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-start gap-2 bg-background",
              )}
            >
              <Phone className="size-4" />
              {business.phone}
            </a>
          )}
          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-start gap-2 bg-background",
              )}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          )}
          {business.instagramUrl && (
            <a
              href={business.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-start gap-2 bg-background",
              )}
            >
              <ExternalLink className="size-4" />
              Instagram
            </a>
          )}
        </div>
      )}
    </div>
  );
}
