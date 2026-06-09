"use client";

import { useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { MapPin } from "lucide-react";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

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

function markerIcon(active: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: active ? 11 : 8,
    fillColor: active ? "#e0436b" : "#f3a8bf",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

interface LocatedBusiness extends MarketplaceBusiness {
  latitude: number;
  longitude: number;
}

interface MarketplaceMapProps {
  businesses: LocatedBusiness[];
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
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
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

    clustererRef.current?.clearMarkers();
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    const markers = businesses.map((business) => {
      const marker = new google.maps.Marker({
        position: { lat: business.latitude, lng: business.longitude },
        title: business.name,
        icon: markerIcon(false),
      });
      marker.addListener("click", () => onActivate(business.id));
      marker.addListener("mouseover", () => onActivate(business.id));
      marker.addListener("mouseout", () => onActivate(null));
      markersRef.current.set(business.id, marker);
      return marker;
    });

    clustererRef.current = new MarkerClusterer({ map, markers });

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
      clustererRef.current?.clearMarkers();
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, businesses]);

  // Re-style + pan to the active marker without rebuilding everything
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const isActive = id === activeId;
      marker.setIcon(markerIcon(isActive));
      marker.setZIndex(isActive ? 999 : undefined);
    });

    if (activeId) {
      const marker = markersRef.current.get(activeId);
      const position = marker?.getPosition();
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
