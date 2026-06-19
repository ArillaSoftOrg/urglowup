import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  Clock,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import Link from "next/link";
import type { BusinessWithDetails } from "@/lib/queries/business";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.77a8.2 8.2 0 004.79 1.53V6.85a4.85 4.85 0 01-1.02-.16z" />
    </svg>
  );
}

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

      {(business.phone || business.whatsapp || business.instagramUrl || business.facebookUrl || business.tiktokUrl) && (
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
              <InstagramIcon className="size-4 text-[#E1306C]" />
              Instagram
            </a>
          )}
          {business.facebookUrl && (
            <a
              href={business.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-start gap-2 bg-background",
              )}
            >
              <FacebookIcon className="size-4 text-[#1877F2]" />
              Facebook
            </a>
          )}
          {business.tiktokUrl && (
            <a
              href={business.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-start gap-2 bg-background",
              )}
            >
              <TiktokIcon className="size-4" />
              TikTok
            </a>
          )}
        </div>
      )}
    </div>
  );
}
