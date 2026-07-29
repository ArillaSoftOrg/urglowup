"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  ExternalLink,
  LocateFixed,
  LoaderCircle,
  MapPin,
  Navigation,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  normalizeBusinessToMapPlace,
  type MapBounds,
  type MapPlace,
} from "@/lib/marketplace/map-place";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";
import { MarketplaceMap } from "./marketplace-map";

export type MapDiscoveryCopy = {
  mapAriaLabel: string;
  userLocationLabel: string;
  mapLoadError: string;
  useLocation: string;
  locating: string;
  locationDenied: string;
  locationFound: string;
  locationUnavailable: string;
  locationUnsupported: string;
  updating: string;
  updateError: string;
  bookable: string;
  googleSource: string;
  notBookable: string;
  viewProfile: string;
  bookNow: string;
  openInGoogle: string;
  claimBusiness: string;
  close: string;
  cityRequired: string;
  noResults: string;
  truncated: string;
  resultsTemplate: string;
};

type MapResponse = {
  places: MapPlace[];
  counts: {
    total: number;
    bookable: number;
    external: number;
  };
  truncated: boolean;
};

interface MapDiscoveryProps {
  initialBusinesses: MarketplaceBusiness[];
  initialExternalPlaces: MapPlace[];
  apiKey: string;
  locale?: string;
  copy: MapDiscoveryCopy;
}

function formatTemplate(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function MapDiscovery({
  initialBusinesses,
  initialExternalPlaces,
  apiKey,
  locale,
  copy,
}: MapDiscoveryProps) {
  const searchParams = useSearchParams();
  const initialPlaces = useMemo(() => {
    const internal = initialBusinesses
      .filter(
        (
          business,
        ): business is MarketplaceBusiness & {
          latitude: number;
          longitude: number;
        } => business.latitude !== null && business.longitude !== null,
      )
      .map((business) => normalizeBusinessToMapPlace(business, locale));
    return [...internal, ...initialExternalPlaces];
  }, [initialBusinesses, initialExternalPlaces, locale]);

  const [places, setPlaces] = useState(initialPlaces);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationState, setLocationState] = useState<
    "idle" | "loading" | "success" | "denied" | "unavailable" | "unsupported"
  >("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const listItemRefs = useRef(new Map<string, HTMLElement>());

  const filterKey = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    return params.toString();
  }, [searchParams]);

  useEffect(() => {
    if (!activeId) return;
    listItemRefs.current.get(activeId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestRef.current?.abort();
    };
  }, []);

  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;

        const params = new URLSearchParams(searchParams.toString());
        params.delete("view");
        params.set("north", String(bounds.north));
        params.set("south", String(bounds.south));
        params.set("east", String(bounds.east));
        params.set("west", String(bounds.west));
        params.set("locale", locale ?? "tr");

        setIsUpdating(true);
        setUpdateError(null);

        try {
          const response = await fetch(`/api/marketplace/map?${params}`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          if (!response.ok) throw new Error("map-request-failed");
          const data = (await response.json()) as MapResponse;
          setPlaces(data.places);
          setTruncated(data.truncated);
          setActiveId((current) =>
            current && data.places.some((place) => place.id === current)
              ? current
              : null,
          );
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            setUpdateError(copy.updateError);
          }
        } finally {
          if (requestRef.current === controller) setIsUpdating(false);
        }
      }, 500);
    },
    [copy.updateError, locale, searchParams],
  );

  const handleUseLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationState("unsupported");
      return;
    }

    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocationState("success");
      },
      (error) => {
        setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }, []);
  const markLocationControlHydrated = useCallback(
    (button: HTMLButtonElement | null) => {
      if (button) button.dataset.locationControlHydrated = "true";
    },
    [],
  );

  const selectedPlace =
    places.find((place) => place.id === activeId) ?? null;
  const internalPlaces = places.filter(
    (place) => place.source === "INTERNAL",
  );
  const externalCount = places.length - internalPlaces.length;
  const locationMessage =
    locationState === "success"
      ? copy.locationFound
      : locationState === "denied"
      ? copy.locationDenied
      : locationState === "unavailable"
        ? copy.locationUnavailable
        : locationState === "unsupported"
          ? copy.locationUnsupported
          : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="pink">
            {formatTemplate(copy.resultsTemplate, places.length)}
          </Badge>
          <Badge variant="outline">
            <span className="size-2 rounded-full bg-brand-purple-foreground" />
            {copy.bookable}: {internalPlaces.length}
          </Badge>
          {externalCount > 0 && (
            <Badge variant="outline">
              <span className="size-2 rounded-full bg-foreground/80" />
              {copy.googleSource}: {externalCount}
            </Badge>
          )}
        </div>

        <Button
          ref={markLocationControlHydrated}
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11 gap-2"
          disabled={locationState === "loading"}
          onClick={handleUseLocation}
        >
          {locationState === "loading" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
          {locationState === "loading" ? copy.locating : copy.useLocation}
        </Button>
      </div>

      {(locationMessage ||
        updateError ||
        (!searchParams.get("city") && externalCount === 0) ||
        truncated) && (
        <div aria-live="polite" className="space-y-1">
          {locationMessage && (
            <p className="text-sm text-muted-foreground">{locationMessage}</p>
          )}
          {updateError && (
            <p className="text-sm text-destructive">{updateError}</p>
          )}
          {!searchParams.get("city") && externalCount === 0 && (
            <p className="text-xs text-muted-foreground">{copy.cityRequired}</p>
          )}
          {truncated && (
            <p className="text-xs text-muted-foreground">{copy.truncated}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(18rem,2fr)_minmax(0,3fr)] lg:items-start">
        <div className="hidden max-h-[calc(100vh-8rem)] space-y-2 overflow-y-auto pr-1 lg:block">
          {internalPlaces.length > 0 ? (
            internalPlaces.map((place) => (
              <CompactMapResult
                key={place.id}
                place={place}
                active={place.id === activeId}
                copy={copy}
                itemRef={(element) => {
                  if (element) listItemRefs.current.set(place.id, element);
                  else listItemRefs.current.delete(place.id);
                }}
                onActivate={setActiveId}
              />
            ))
          ) : (
            <div className="rounded-xl bg-surface-cream px-4 py-8 text-center">
              <Building2 className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{copy.noResults}</p>
            </div>
          )}
        </div>

        <div className="relative -mx-4 h-[calc(100svh-12rem)] min-h-[32rem] overflow-hidden border-y border-border/70 bg-surface-cream sm:mx-0 sm:rounded-2xl sm:border lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
          <MarketplaceMap
            businesses={places}
            apiKey={apiKey}
            activeId={activeId}
            fitRequestKey={filterKey}
            userLocation={userLocation}
            fallbackLocationQuery={searchParams.get("city") ?? undefined}
            errorLabel={copy.mapLoadError}
            ariaLabel={copy.mapAriaLabel}
            userLocationLabel={copy.userLocationLabel}
            onActivate={setActiveId}
            onBoundsChange={handleBoundsChange}
          />

          {isUpdating && (
            <div
              role="status"
              className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-xs font-medium shadow-sm"
            >
              <LoaderCircle className="size-3.5 animate-spin" />
              {copy.updating}
            </div>
          )}

          {!selectedPlace && places.length === 0 && !isUpdating && (
            <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl bg-background/95 px-5 py-4 text-center shadow-md">
              <MapPin className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">{copy.noResults}</p>
            </div>
          )}

          {selectedPlace && (
            <SelectedPlacePreview
              place={selectedPlace}
              copy={copy}
              onClose={() => setActiveId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CompactMapResult({
  place,
  active,
  copy,
  itemRef,
  onActivate,
}: {
  place: MapPlace;
  active: boolean;
  copy: MapDiscoveryCopy;
  itemRef: (element: HTMLElement | null) => void;
  onActivate: (id: string) => void;
}) {
  return (
    <article
      ref={itemRef}
      data-map-list-id={place.id}
      className={cn(
        "rounded-xl border bg-background p-3 transition-[border-color,box-shadow]",
        active
          ? "border-brand-purple-foreground/40 shadow-md"
          : "border-border/60 hover:border-border",
      )}
      onMouseEnter={() => onActivate(place.id)}
    >
      <button
        type="button"
        className="w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => onActivate(place.id)}
      >
        <div className="flex items-start gap-3">
          <MapThumbnail place={place} />
          <PlaceText place={place} />
        </div>
      </button>
      {place.profileUrl && (
        <Link
          href={place.profileUrl}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-purple-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {copy.viewProfile}
          <Navigation className="size-3.5" />
        </Link>
      )}
    </article>
  );
}

function MapThumbnail({ place }: { place: MapPlace }) {
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-pink">
      {place.coverImageUrl ? (
        <Image
          src={place.coverImageUrl}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Building2 className="size-5 text-brand-pink-foreground" />
        </div>
      )}
    </div>
  );
}

function PlaceText({ place }: { place: MapPlace }) {
  const location = [place.district, place.city].filter(Boolean).join(" · ");
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{place.name}</p>
      {(place.categoryName || location) && (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {[place.categoryName, location].filter(Boolean).join(" · ")}
        </p>
      )}
      {typeof place.rating === "number" && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium tabular-nums">
          <Star className="size-3.5 fill-warning text-warning-foreground" />
          {place.rating.toFixed(1)} / 10
          {typeof place.reviewCount === "number" && (
            <span className="text-muted-foreground">({place.reviewCount})</span>
          )}
        </p>
      )}
    </div>
  );
}

function SelectedPlacePreview({
  place,
  copy,
  onClose,
}: {
  place: MapPlace;
  copy: MapDiscoveryCopy;
  onClose: () => void;
}) {
  const isInternal = place.source === "INTERNAL";

  return (
    <article className="absolute inset-x-3 bottom-3 rounded-xl border border-border/70 bg-background p-3 shadow-lg sm:left-3 sm:right-auto sm:w-[min(24rem,calc(100%-1.5rem))]">
      <div className="flex items-start gap-3">
        <MapThumbnail place={place} />
        <PlaceText place={place} />
        <button
          type="button"
          aria-label={copy.close}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {!isInternal && (
        <div className="mt-3 rounded-lg bg-neutral px-3 py-2 text-xs text-neutral-foreground">
          <p className="font-medium">{copy.googleSource}</p>
          <p className="mt-0.5">{copy.notBookable}</p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {isInternal && place.profileUrl ? (
          <>
            <Link
              href={place.profileUrl}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {copy.viewProfile}
            </Link>
            <Link
              href={`${place.profileUrl}/book`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-pink/20 bg-brand-pink px-3 text-sm font-medium text-brand-pink-foreground hover:bg-surface-pink-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {copy.bookNow}
            </Link>
          </>
        ) : (
          <>
            {place.googleMapsUri && (
              <a
                href={place.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {copy.openInGoogle}
                <ExternalLink className="size-3.5" />
              </a>
            )}
            {place.claimUrl && (
              <Link
                href={place.claimUrl}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {copy.claimBusiness}
              </Link>
            )}
          </>
        )}
      </div>
    </article>
  );
}
