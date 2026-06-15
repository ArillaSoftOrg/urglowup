import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Star,
} from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

export function ProfileHeader({
  business,
  reviewSummary,
  isOpen,
  location,
}: {
  business: BusinessWithDetails;
  reviewSummary: { averageRating: number | null; totalCount: number };
  isOpen: boolean;
  location: string;
  locale: string;
}) {
  const categories = business.categories.map((bc) => bc.category);
  const addressQuery = [business.name, business.address, business.district, business.city]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-3">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold leading-none tracking-normal text-foreground sm:text-5xl">
            {business.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-base text-muted-foreground">
            {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null ? (
              <span className="flex items-center gap-1 text-foreground">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">
                  {reviewSummary.averageRating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  ({reviewSummary.totalCount} yorum)
                </span>
              </span>
            ) : (
              <span>Henuz yorum yok</span>
            )}
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              <span className={isOpen ? "font-medium text-green-700" : ""}>
                {isOpen ? "Acik" : "Kapali"}
              </span>
            </span>
            {location && (
              <>
                <span aria-hidden className="text-muted-foreground/40">
                  ·
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {location}
                </span>
              </>
            )}
            {addressQuery && (
              <>
                <span aria-hidden className="text-muted-foreground/40">
                  ·
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <Navigation className="size-4" />
                  Yol tarifi
                </a>
              </>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Badge key={cat.id} variant="neutral">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 lg:hidden">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
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
                "gap-1.5",
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
                "gap-1.5",
              )}
            >
              Instagram
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Paylas"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-lg" }),
            "rounded-full",
          )}
        >
          <Share2 className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Favorilere ekle"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-lg" }),
            "rounded-full",
          )}
        >
          <Heart className="size-4" />
        </button>
      </div>
    </div>
  );
}
