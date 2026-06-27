"use client";

import { useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { MapPin } from "lucide-react";
import type { MapPlace } from "@/lib/marketplace/map-place";

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { elementType: "geometry", stylers: [{ color: "#f5f0eb" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#d4c5ba" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#faf5f0" }] },
    { featureType: "landscape", stylers: [{ color: "#f0ebe5" }] },
  ],
};

// Roughly centers on Turkey when there's nothing to fit bounds to
const DEFAULT_CENTER = { lat: 39.0, lng: 35.0 };
const DEFAULT_ZOOM = 6;

function markerIcon(active: boolean, variant: "bookable" | "external"): google.maps.Symbol {
  const baseColor  = variant === "bookable" ? "#16a34a" : "#374151";
  const lightColor = variant === "bookable" ? "#86efac" : "#9ca3af";
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: active ? 11 : 8,
    fillColor: active ? baseColor : lightColor,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

interface MarketplaceMapProps {
  businesses: MapPlace[];
  apiKey: string;
  activeId: string | null;
  onActivate: (id: string | null) => void;
}

export function MarketplaceMap({ businesses, apiKey, activeId, onActivate }: MarketplaceMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    language: "tr",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: google.maps.Marker; variant: "bookable" | "external" }>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);

  const handleLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const handleUnmount = () => {
    mapRef.current = null;
  };

  // (Re)build markers + clusterer whenever the visible business set changes
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
        icon: markerIcon(false, place.markerVariant),
      });
      marker.addListener("click", () => onActivate(place.id));
      marker.addListener("mouseover", () => onActivate(place.id));
      marker.addListener("mouseout", () => onActivate(null));
      markersById.set(place.id, { marker, variant: place.markerVariant });
      return marker;
    });

    const clusterer = new MarkerClusterer({ map, markers });
    clustererRef.current = clusterer;

    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      for (const marker of markers) {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      }
      map.fitBounds(bounds, 48);
    } else {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
    }

    return () => {
      clusterer.clearMarkers();
      markersById.forEach(({ marker }) => marker.setMap(null));
      markersById.clear();
    };
  }, [isLoaded, businesses, onActivate]);

  // Re-style + pan to the active marker without rebuilding everything
  useEffect(() => {
    markersRef.current.forEach(({ marker, variant }, id) => {
      const isActive = id === activeId;
      marker.setIcon(markerIcon(isActive, variant));
      marker.setZIndex(isActive ? 999 : undefined);
    });

    if (activeId) {
      const entry = markersRef.current.get(activeId);
      const position = entry?.marker.getPosition();
      if (position && mapRef.current) mapRef.current.panTo(position);
    }
  }, [activeId]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-cream">
        <div className="text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-pink/15">
            <MapPin className="size-5 text-brand-pink-foreground" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Harita yüklenemedi</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="size-full animate-pulse bg-surface-cream" />;
  }

  return (
    <GoogleMap
      mapContainerClassName="size-full"
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      options={mapOptions}
      onLoad={handleLoad}
      onUnmount={handleUnmount}
    />
  );
}
