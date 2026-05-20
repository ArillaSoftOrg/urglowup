import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Phone, MessageCircle, CalendarCheck, Star } from "lucide-react";
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
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-base">{business.name} ile Randevu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviewSummary.totalCount > 0 && reviewSummary.averageRating !== null && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-cream px-3 py-2 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{reviewSummary.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              · {reviewSummary.totalCount} değerlendirme
            </span>
          </div>
        )}

        <Link
          href={`/b/${business.slug}/book`}
          className={cn(buttonVariants({ size: "lg" }), "w-full gap-1.5")}
        >
          <CalendarCheck className="size-4" />
          Randevu Talep Et
        </Link>

        {(business.phone || business.whatsapp || business.instagramUrl) && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">İletişim</p>
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-start gap-1.5"
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
                  "w-full justify-start gap-1.5"
                )}
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
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-start gap-1.5"
                )}
              >
                Instagram
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
