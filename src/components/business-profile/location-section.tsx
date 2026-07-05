import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Navigation } from "lucide-react";
import { LazyBusinessMap } from "./lazy-business-map";
import { LocationPinIcon } from "./location-pin-icon";
import type { BusinessWithDetails } from "@/lib/queries/business";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

function buildMapsEmbedUrl(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

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
  const embedUrl = buildMapsEmbedUrl(mapQuery || fullAddress);
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
        <h2 id="location-title" className="sr-only text-2xl font-bold tracking-normal text-foreground md:not-sr-only">
          Konum
        </h2>
      )}

      <div className="relative overflow-hidden rounded-xl border border-border/70 shadow-sm md:rounded-2xl">
        {mapsApiKey && hasCoords ? (
          <LazyBusinessMap
            lat={business.latitude as number}
            lng={business.longitude as number}
            name={business.name}
            apiKey={mapsApiKey}
            query={mapQuery}
            className="flex h-[224px] w-full flex-col items-center justify-center overflow-hidden bg-muted/30 px-4 text-center md:h-[380px] lg:h-[480px]"
          />
        ) : (
          <iframe
            title={`${business.name} konumu`}
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[224px] w-full border-0 bg-muted/30 md:h-[380px] lg:h-[480px]"
          />
        )}
      </div>

      <div className="space-y-1.5 text-sm md:hidden">
        {fullAddress && (
          <p className="font-medium leading-snug text-foreground">{fullAddress}</p>
        )}
      </div>

      <div className="hidden flex-col gap-3 md:flex md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <LocationPinIcon className="mt-0.5" />
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
