import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Navigation } from "lucide-react";
import { LazyBusinessMap } from "./lazy-business-map";
import type { BusinessWithDetails } from "@/lib/queries/business";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function LocationSection({
  business,
  showTitle = true,
}: {
  business: BusinessWithDetails;
  showTitle?: boolean;
}) {
  const hasAddress = business.address || business.city || business.district;
  if (!hasAddress) return null;

  const addressParts = [business.address, business.district, business.city].filter(Boolean);
  const fullAddress = addressParts.join(", ");
  const mapQuery = [business.name, fullAddress].filter(Boolean).join(" ");
  const hasCoords =
    typeof business.latitude === "number" &&
    typeof business.longitude === "number";

  const directionsUrl =
    hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <section
      aria-label={showTitle ? undefined : "Konum"}
      aria-labelledby={showTitle ? "location-title" : undefined}
      className="space-y-5"
    >
      {showTitle && (
        <h2 id="location-title" className="text-2xl font-bold tracking-normal text-foreground">
          Konum
        </h2>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/70 shadow-sm">
        {hasCoords && mapsApiKey ? (
          <LazyBusinessMap
            lat={business.latitude as number}
            lng={business.longitude as number}
            name={business.name}
            apiKey={mapsApiKey}
            className="flex h-[380px] w-full flex-col items-center justify-center overflow-hidden bg-muted/30 px-4 text-center sm:h-[480px]"
          />
        ) : (
          <iframe
            title={`${business.name} konumu`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[380px] w-full bg-muted/30 sm:h-[480px]"
          />
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-0.5 text-sm">
            {business.address && (
              <p className="font-medium text-foreground">{business.address}</p>
            )}
            {(business.district || business.city) && (
              <p className="text-muted-foreground">
                {[business.district, business.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0 gap-1.5"
          )}
        >
          <Navigation className="size-3.5" />
          Yol Tarifi Al
        </a>
      </div>
    </section>
  );
}
