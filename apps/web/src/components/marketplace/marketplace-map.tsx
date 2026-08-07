"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { MapPin } from "lucide-react";
import type { MapBounds, MapPlace } from "@/lib/marketplace/map-place";

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { elementType: "geometry", stylers: [{ color: "#f5f0eb" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#d8d0c8" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#fffdf9" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#faf5f0" }] },
    { featureType: "landscape", stylers: [{ color: "#f0ebe5" }] },
  ],
};

const DEFAULT_CENTER = { lat: 39, lng: 35 };
const DEFAULT_ZOOM = 6;

function markerIcon(
  active: boolean,
  place: MapPlace,
): google.maps.Icon {
  const isExternal = place.markerVariant === "external";
  const width = active ? 52 : 46;
  const height = active ? 60 : 54;
  const fill = isExternal ? "#292b30" : active ? "#6e335f" : "#4f2447";
  const score =
    !isExternal && typeof place.rating === "number"
      ? place.rating.toFixed(1)
      : "";
  const content = score
    ? `<text x="23" y="23" text-anchor="middle" dominant-baseline="middle" fill="#fffdf9" font-size="12" font-family="Segoe UI,Arial,sans-serif" font-weight="700">${score}</text>`
    : `<circle cx="23" cy="21" r="4" fill="#fffdf9"/>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="54" viewBox="0 0 46 54">
      <path d="M23 1.5C11.1 1.5 2 10.4 2 21.4c0 14.9 17.7 29.2 19.7 30.8.8.6 1.8.6 2.6 0C26.3 50.6 44 36.3 44 21.4 44 10.4 34.9 1.5 23 1.5Z" fill="${fill}" stroke="#fffdf9" stroke-width="3"/>
      ${content}
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  };
}

function toBounds(map: google.maps.Map): MapBounds | null {
  const bounds = map.getBounds();
  if (!bounds) return null;
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  return {
    north: northEast.lat(),
    east: northEast.lng(),
    south: southWest.lat(),
    west: southWest.lng(),
  };
}

interface MarketplaceMapProps {
  businesses: MapPlace[];
  apiKey: string;
  activeId: string | null;
  fitRequestKey: string;
  userLocation: { lat: number; lng: number } | null;
  fallbackLocationQuery?: string;
  errorLabel: string;
  ariaLabel: string;
  userLocationLabel: string;
  onActivate: (id: string | null) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}

export function MarketplaceMap({
  businesses,
  apiKey,
  activeId,
  fitRequestKey,
  userLocation,
  fallbackLocationQuery,
  errorLabel,
  ariaLabel,
  userLocationLabel,
  onActivate,
  onBoundsChange,
}: MarketplaceMapProps) {
  const [authFailed, setAuthFailed] = useState(false);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    language: "tr",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef(
    new Map<string, { marker: google.maps.Marker; place: MapPlace }>(),
  );
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const lastFitRequestKeyRef = useRef<string | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    const mapsWindow = window as typeof window & {
      gm_authFailure?: () => void;
    };
    const previousHandler = mapsWindow.gm_authFailure;
    mapsWindow.gm_authFailure = () => {
      setAuthFailed(true);
      previousHandler?.();
    };

    return () => {
      mapsWindow.gm_authFailure = previousHandler;
    };
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  const handleLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const handleUnmount = () => {
    mapRef.current = null;
  };

  const handleIdle = () => {
    if (!mapRef.current) return;
    const bounds = toBounds(mapRef.current);
    if (bounds) onBoundsChangeRef.current(bounds);
  };

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const markersById = markersRef.current;

    clustererRef.current?.clearMarkers();
    markersById.forEach(({ marker }) => marker.setMap(null));
    markersById.clear();

    const markers = businesses.map((place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        title: place.name,
        icon: markerIcon(place.id === activeIdRef.current, place),
        zIndex: place.id === activeIdRef.current ? 999 : undefined,
      });

      marker.addListener("click", () => onActivate(place.id));
      if (place.source === "INTERNAL") {
        marker.addListener("mouseover", () => onActivate(place.id));
      }

      markersById.set(place.id, { marker, place });
      return marker;
    });

    clustererRef.current = new MarkerClusterer({ map, markers });

    if (lastFitRequestKeyRef.current !== fitRequestKey) {
      lastFitRequestKeyRef.current = fitRequestKey;
      if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        for (const marker of markers) {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        }
        map.fitBounds(bounds, 56);
      } else {
        if (fallbackLocationQuery) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { address: `${fallbackLocationQuery}, Türkiye` },
            (results, status) => {
              const location = results?.[0]?.geometry.location;
              if (status === "OK" && location) {
                map.setCenter(location);
                map.setZoom(11);
              } else {
                map.setCenter(DEFAULT_CENTER);
                map.setZoom(DEFAULT_ZOOM);
              }
            },
          );
        } else {
          map.setCenter(DEFAULT_CENTER);
          map.setZoom(DEFAULT_ZOOM);
        }
      }
    }

    return () => {
      clustererRef.current?.clearMarkers();
      markersById.forEach(({ marker }) => marker.setMap(null));
      markersById.clear();
    };
  }, [isLoaded, businesses, fallbackLocationQuery, fitRequestKey, onActivate]);

  useEffect(() => {
    markersRef.current.forEach(({ marker, place }, id) => {
      const isActive = id === activeId;
      marker.setIcon(markerIcon(isActive, place));
      marker.setZIndex(isActive ? 999 : undefined);
    });

    if (!activeId || !mapRef.current) return;
    const position = markersRef.current.get(activeId)?.marker.getPosition();
    if (position) mapRef.current.panTo(position);
  }, [activeId]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = null;
    if (!userLocation) return;

    userMarkerRef.current = new google.maps.Marker({
      map: mapRef.current,
      position: userLocation,
      title: userLocationLabel,
      zIndex: 1000,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#2563eb",
        fillOpacity: 1,
        strokeColor: "#fffdf9",
        strokeWeight: 3,
      },
    });
    mapRef.current.panTo(userLocation);
    mapRef.current.setZoom(14);

    return () => {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
    };
  }, [isLoaded, userLocation, userLocationLabel]);

  if (loadError || authFailed) {
    return (
      <div className="flex size-full items-start justify-center bg-surface-cream pt-12 sm:items-center sm:pt-0">
        <div className="max-w-xs px-5 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-pink/20">
            <MapPin className="size-5 text-brand-pink-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{errorLabel}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="size-full animate-pulse bg-surface-cream"
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div className="size-full" aria-label={ariaLabel}>
      <GoogleMap
        mapContainerClassName="size-full"
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
        onLoad={handleLoad}
        onUnmount={handleUnmount}
        onIdle={handleIdle}
      />
    </div>
  );
}
