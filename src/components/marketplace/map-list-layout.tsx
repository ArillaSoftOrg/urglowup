"use client";

import { useState } from "react";
import Link from "next/link";
import { List, Map as MapIcon, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BusinessCard } from "./business-card";
import { MarketplaceMap } from "./marketplace-map";
import { cn } from "@/lib/utils";
import { normalizeBusinessToMapPlace } from "@/lib/marketplace/map-place";
import type { MapPlace } from "@/lib/marketplace/map-place";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

interface MapListLayoutProps {
  businesses: MarketplaceBusiness[];
  externalPlaces?: MapPlace[];
  apiKey: string;
  emptyMessage: string;
  unlocatedNotice: (count: number) => string;
  noBookableNotice?: string;
  locale?: string;
  listLabel: string;
  mapLabel: string;
}

export function MapListLayout({
  businesses,
  externalPlaces,
  apiKey,
  emptyMessage,
  unlocatedNotice,
  noBookableNotice,
  locale,
  listLabel,
  mapLabel,
}: MapListLayoutProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const external = externalPlaces ?? [];
  const forBusinessHref =
    locale && locale !== "tr" ? `/${locale}/for-business` : "/for-business";

  // Only fall back to the empty state when there are neither bookable
  // businesses nor external markers to show.
  if (businesses.length === 0 && external.length === 0) {
    return <EmptyState icon={Store} headline={emptyMessage} surface="cream" />;
  }

  const located = businesses.filter(
    (b): b is MarketplaceBusiness & { latitude: number; longitude: number } =>
      b.latitude != null && b.longitude != null
  );
  const internalPlaces = located.map((b) => normalizeBusinessToMapPlace(b, locale));
  const mapPlaces = [...internalPlaces, ...external];
  const unlocatedCount = businesses.length - located.length;

  return (
    <div className="space-y-4">
      {/* Mobile list/map toggle */}
      <div className="flex gap-2 lg:hidden">
        <Button
          type="button"
          variant={mobileView === "list" ? "brand" : "outline"}
          size="sm"
          onClick={() => setMobileView("list")}
          className="gap-1.5"
        >
          <List className="size-4" />
          {listLabel}
        </Button>
        <Button
          type="button"
          variant={mobileView === "map" ? "brand" : "outline"}
          size="sm"
          onClick={() => setMobileView("map")}
          className="gap-1.5"
        >
          <MapIcon className="size-4" />
          {mapLabel}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        {/* List — internal (bookable) businesses only; external never appears here */}
        <div className={cn("space-y-3", mobileView === "map" && "hidden lg:block")}>
          {businesses.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {noBookableNotice ?? emptyMessage}
              </p>
              <Link
                href={forBusinessHref}
                className="inline-block text-sm font-medium text-brand-pink-foreground hover:underline"
              >
                İşletmeniz Fersha&apos;da yer alsın →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  onMouseEnter={() => setActiveId(business.id)}
                  onMouseLeave={() => setActiveId((current) => (current === business.id ? null : current))}
                  className={cn(
                    "rounded-2xl transition-shadow",
                    activeId === business.id && "ring-2 ring-brand-pink"
                  )}
                >
                  <BusinessCard business={business} locale={locale} />
                </div>
              ))}
            </div>
          )}
          {unlocatedCount > 0 && (
            <p className="text-xs text-muted-foreground">{unlocatedNotice(unlocatedCount)}</p>
          )}
        </div>

        {/* Map */}
        <div
          className={cn(
            "relative h-[60vh] overflow-hidden rounded-2xl border border-border/60 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]",
            mobileView === "list" && "hidden lg:block"
          )}
        >
          <MarketplaceMap
            businesses={mapPlaces}
            apiKey={apiKey}
            activeId={activeId}
            onActivate={setActiveId}
          />

          {/* Legend — text + color (not color-only) for accessibility */}
          <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] leading-tight shadow-sm backdrop-blur">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-full bg-[#16a34a]" />
              <span className="text-foreground">Randevu alınabilir</span>
            </div>
            {external.length > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="size-2.5 shrink-0 rounded-full bg-[#374151]" />
                <span className="text-foreground">Google Maps kaynağı</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
