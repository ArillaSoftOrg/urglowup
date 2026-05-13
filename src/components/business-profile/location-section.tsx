import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Navigation } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

export function LocationSection({
  business,
}: {
  business: BusinessWithDetails;
}) {
  const hasAddress = business.address || business.city || business.district;
  if (!hasAddress) return null;

  const addressParts = [business.address, business.district, business.city].filter(Boolean);
  const fullAddress = addressParts.join(", ");
  const mapsQuery = encodeURIComponent(fullAddress);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{fullAddress}</p>
        </div>

        {/* Map placeholder */}
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/30">
          <div className="text-center">
            <MapPin className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">
              Map integration coming soon
            </p>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full gap-1.5"
          )}
        >
          <Navigation className="size-4" />
          Get Directions
        </a>
      </CardContent>
    </Card>
  );
}
