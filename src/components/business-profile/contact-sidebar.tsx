import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Phone, MessageCircle, CalendarCheck } from "lucide-react";
import Link from "next/link";
import type { BusinessWithDetails } from "@/lib/queries/business";

export function ContactSidebar({
  business,
}: {
  business: BusinessWithDetails;
}) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-base">Book with {business.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link
          href={`/b/${business.slug}/book`}
          className={cn(buttonVariants({ size: "lg" }), "w-full gap-1.5")}
        >
          <CalendarCheck className="size-4" />
          Request Appointment
        </Link>

        {(business.phone || business.whatsapp || business.instagramUrl) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Contact
              </p>
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
                    "w-full justify-start gap-1.5"
                  )}
                >
                  Instagram
                </a>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
