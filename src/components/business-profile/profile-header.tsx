import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Phone, MessageCircle } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

export function ProfileHeader({
  business,
}: {
  business: BusinessWithDetails;
}) {
  const categories = business.categories.map((bc) => bc.category);

  return (
    <div className="space-y-3 pt-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          {business.name}
        </h1>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Badge key={cat.id} variant="neutral">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Contact buttons — mobile only */}
      <div className="flex flex-wrap gap-2 lg:hidden">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
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
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <MessageCircle className="size-4" />
            WhatsApp ile Ulaş
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
    </div>
  );
}
