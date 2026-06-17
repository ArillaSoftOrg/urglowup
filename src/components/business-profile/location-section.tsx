import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Navigation } from "lucide-react";
import { LazyBusinessMap } from "./lazy-business-map";
import type { BusinessWithDetails } from "@/lib/queries/business";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function LocationSection({
  business,
}: {
  business: BusinessWithDetails;
}) {
  const hasAddress = business.address || business.city || business.district;
  if (!hasAddress) return null;

  const addressParts = [business.address, business.district, business.city].filter(Boolean);
  const fullAddress = addressParts.join(", ");
  const hasCoords =
    typeof business.latitude === "number" &&
    typeof business.longitude === "number";

  const directionsUrl =
    hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konum</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{fullAddress}</p>
        </div>

        {hasCoords && mapsApiKey ? (
          <LazyBusinessMap
            lat={business.latitude as number}
            lng={business.longitude as number}
            name={business.name}
            apiKey={mapsApiKey}
          />
        ) : null}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full gap-1.5"
          )}
        >
          <Navigation className="size-4" />
          Yol Tarifi Al
        </a>
      </CardContent>
    </Card>
  );
}
