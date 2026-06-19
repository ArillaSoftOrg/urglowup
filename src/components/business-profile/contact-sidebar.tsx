import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  Clock,
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
  locale,
}: {
  business: BusinessWithDetails;
  reviewSummary: ReviewSummary;
  locale?: string;
}) {
  const featuredServices = business.services.slice(0, 3);
  const hrefPrefix = locale && locale !== "tr" ? `/${locale}` : "";

  return (
    <div className="sticky top-28 overflow-hidden rounded-lg border bg-background shadow-lg">
      <div className="space-y-5 p-6">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Randevu</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal">Planını seç</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Hizmeti seç, uygun zamanı gör ve randevunu birkaç adımda tamamla.
          </p>
        </div>

        {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <Star className="size-4 fill-rating text-rating" />
            <span className="font-semibold">
              {reviewSummary.averageRating.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              {reviewSummary.totalCount} yorum
            </span>
          </div>
        )}

        {featuredServices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Popüler hizmetler
            </p>
            <div className="divide-y rounded-lg border">
              {featuredServices.map((service) => (
                  <Link
                  key={service.id}
                  href={`${hrefPrefix}/b/${business.slug}/book?service=${service.id}`}
                  className="block px-4 py-3 transition hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{service.name}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {service.durationMinutes} dk
                      </p>
                    </div>
                    {service.price && (
                      <span className="shrink-0 text-sm font-bold">
                        ₺{Number(service.price)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link
          href={`${hrefPrefix}/b/${business.slug}/book`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-14 w-full gap-2 rounded-full text-base font-bold",
          )}
        >
          <CalendarCheck className="size-4" />
          Hemen rezervasyon yap
        </Link>
      </div>

      {(business.phone || business.whatsapp || business.instagramUrl) && (
        <div className="space-y-2 border-t bg-muted/20 p-6">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            İletişim
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
