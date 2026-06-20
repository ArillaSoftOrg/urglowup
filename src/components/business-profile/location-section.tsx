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
    <section aria-labelledby="location-title" className="space-y-4">
      {showTitle && (
        <h2 id="location-title" className="text-xl font-bold tracking-normal text-foreground lg:text-[28px]">
          Konum
        </h2>
      )}

      {hasCoords && mapsApiKey ? (
        <LazyBusinessMap
          lat={business.latitude as number}
          lng={business.longitude as number}
          name={business.name}
          apiKey={mapsApiKey}
          className="flex h-[320px] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-surface-cream px-4 text-center sm:h-[420px]"
        />
      ) : (
        <iframe
          title={`${business.name} konumu`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[320px] w-full rounded-xl border border-border/70 bg-surface-cream sm:h-[420px]"
        />
      )}

      <div className="flex flex-col gap-3 text-base sm:flex-row sm:items-center sm:justify-between">
        <p className="flex min-w-0 items-start gap-2 font-medium text-foreground">
          <MapPin className="mt-1 size-4 shrink-0 text-muted-foreground" />
          <span>{fullAddress}</span>
        </p>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "link", size: "default" }),
            "h-auto shrink-0 justify-start gap-1.5 px-0 text-primary sm:justify-center"
          )}
        >
          <Navigation className="size-4" />
          Yol Tarifi Al
        </a>
      </div>
    </section>
  );
}
