import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star, Phone, MessageCircle } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { isBusinessOpen } from "./hours-section";

export function ProfileHeader({
  business,
}: {
  business: BusinessWithDetails;
}) {
  const categories = business.categories.map((bc) => bc.category);
  const reviewCount = business._count.reviews;
  const avgRating =
    reviewCount > 0
      ? business.reviews.reduce((sum, r) => sum + r.rating, 0) /
        business.reviews.length
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {business.name}
          </h1>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <Badge key={cat.id} variant="secondary">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {avgRating !== null && (
          <div className="flex items-center gap-1.5 rounded-lg bg-brand-cream px-3 py-1.5">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        )}
      </div>

      {(business.city || business.district) && (
        <p className="text-sm text-muted-foreground">
          {[business.district, business.city].filter(Boolean).join(", ")}
        </p>
      )}

      {/* Contact buttons - mobile */}
      <div className="flex flex-wrap gap-2 lg:hidden">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Phone className="size-4" />
            Call
          </a>
        )}
        {business.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
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
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            Instagram
          </a>
        )}
      </div>

      {/* Open/closed + status badges */}
      <div className="flex flex-wrap gap-2">
        {business.hours.length > 0 && (
          <Badge variant={isBusinessOpen(business.hours) ? "default" : "secondary"}>
            {isBusinessOpen(business.hours) ? "Open now" : "Closed"}
          </Badge>
        )}
        <Badge
          variant={
            business.status === "ACTIVE_MARKETPLACE" ? "default" : "outline"
          }
        >
          {business.status.replace(/_/g, " ").toLowerCase()}
        </Badge>
        {business.isMarketplaceVisible && (
          <Badge variant="secondary">Marketplace visible</Badge>
        )}
      </div>
    </div>
  );
}
