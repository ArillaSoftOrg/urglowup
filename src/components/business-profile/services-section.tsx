import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Scissors, CalendarCheck } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

function formatPrice(service: BusinessWithDetails["services"][number]) {
  if (service.priceType === "FREE_CONSULTATION") return "Free consultation";
  if (service.priceType === "CONSULTATION_REQUIRED") return "Price on consultation";
  if (!service.price) return null;

  const amount = `$${Number(service.price)}`;
  if (service.priceType === "STARTS_FROM") return `From ${amount}`;
  return amount;
}

export function ServicesSection({
  business,
}: {
  business: BusinessWithDetails;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        {business.services.length > 0 && (
          <CardDescription>
            {business.services.length} service
            {business.services.length !== 1 ? "s" : ""} available
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {business.services.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-pink">
              <Scissors className="size-6 text-brand-pink-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">No services listed yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This business hasn&apos;t added services yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {business.services.map((service) => {
              const price = formatPrice(service);
              return (
                <div
                  key={service.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {service.durationMinutes} min
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {price && (
                      <Badge variant="secondary">{price}</Badge>
                    )}
                    <Link
                      href={`/b/${business.slug}/book?service=${service.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-7 text-xs"
                      )}
                    >
                      <CalendarCheck className="size-3" />
                      Book
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
