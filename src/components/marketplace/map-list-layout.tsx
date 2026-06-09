"use client";

import { useState } from "react";
import { List, Map as MapIcon, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BusinessCard } from "./business-card";
import { MarketplaceMap } from "./marketplace-map";
import { cn } from "@/lib/utils";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

interface MapListLayoutProps {
  businesses: MarketplaceBusiness[];
  apiKey: string;
  emptyMessage: string;
  unlocatedNotice: (count: number) => string;
  locale?: string;
  listLabel: string;
  mapLabel: string;
}

export function MapListLayout({
  businesses,
  apiKey,
  emptyMessage,
  unlocatedNotice,
  locale,
  listLabel,
  mapLabel,
}: MapListLayoutProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  if (businesses.length === 0) {
    return <EmptyState icon={Store} headline={emptyMessage} surface="cream" />;
  }

  const located = businesses.filter(
    (b): b is MarketplaceBusiness & { latitude: number; longitude: number } =>
      b.latitude != null && b.longitude != null
  );
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
        {/* List */}
        <div className={cn("space-y-3", mobileView === "map" && "hidden lg:block")}>
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
          {unlocatedCount > 0 && (
            <p className="text-xs text-muted-foreground">{unlocatedNotice(unlocatedCount)}</p>
          )}
        </div>

        {/* Map */}
        <div
          className={cn(
            "h-[60vh] overflow-hidden rounded-2xl border border-border/60 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]",
            mobileView === "list" && "hidden lg:block"
          )}
        >
          <MarketplaceMap
            businesses={located}
            apiKey={apiKey}
            activeId={activeId}
            onActivate={setActiveId}
          />
        </div>
      </div>
    </div>
  );
}
