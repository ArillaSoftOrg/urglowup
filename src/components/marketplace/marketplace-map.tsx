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

// External-marker copy (TR). Kept in one place; no Google native content.
const EXTERNAL_INFO_COPY = {
  source: "Google Maps kaynağı",
  description:
    "Bu işletme Fersha'ya henüz katılmamış olabilir. Fersha üzerinden randevu alınamaz.",
  openInMaps: "Google Maps'te aç",
  claim: "Bu işletme sizin mi?",
} as const;

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

/**
 * Builds external-marker InfoWindow content with DOM nodes + textContent
 * (never HTML-string interpolation) so operational labels can't inject markup.
 * Shows ONLY our operational fields — no Google native content.
 */
function buildExternalInfoContent(place: MapPlace): HTMLElement {
  const root = document.createElement("div");
  root.style.maxWidth = "220px";
  root.style.fontSize = "13px";
  root.style.lineHeight = "1.4";

  const title = document.createElement("p");
  title.style.fontWeight = "600";
  title.style.margin = "0 0 2px";
  title.textContent = place.name;
  root.appendChild(title);

  const loc = [place.city, place.district].filter(Boolean).join(" · ");
  if (loc) {
    const locEl = document.createElement("p");
    locEl.style.margin = "0 0 4px";
    locEl.style.color = "#6b7280";
    locEl.textContent = loc;
    root.appendChild(locEl);
  }

  const source = document.createElement("p");
  source.style.margin = "0";
  source.style.color = "#6b7280";
  source.textContent = EXTERNAL_INFO_COPY.source;
  root.appendChild(source);

  const description = document.createElement("p");
  description.style.margin = "4px 0 6px";
  description.style.color = "#6b7280";
  description.textContent = EXTERNAL_INFO_COPY.description;
  root.appendChild(description);

  if (place.googleMapsUri) {
    const link = document.createElement("a");
    link.href = place.googleMapsUri;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "block";
    link.style.color = "#2563eb";
    link.style.fontWeight = "500";
    link.textContent = EXTERNAL_INFO_COPY.openInMaps;
    link.setAttribute("aria-label", `${place.name} — ${EXTERNAL_INFO_COPY.openInMaps}`);
    root.appendChild(link);
  }

  if (place.claimUrl) {
    const claim = document.createElement("a");
    claim.href = place.claimUrl;
    claim.style.display = "block";
    claim.style.marginTop = "4px";
    claim.style.color = "#2563eb";
    claim.style.fontWeight = "500";
    claim.textContent = EXTERNAL_INFO_COPY.claim;
    claim.setAttribute("aria-label", `${place.name} — ${EXTERNAL_INFO_COPY.claim}`);
    root.appendChild(claim);
  }

  return root;
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
  const markersRef = useRef<Map<string, { marker: google.maps.Marker; place: MapPlace }>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
    const infoWindow = infoWindowRef.current;

    clustererRef.current?.clearMarkers();
    markersById.forEach(({ marker }) => marker.setMap(null));
    markersById.clear();

    const markers = businesses.map((place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        title: place.name,
        icon: markerIcon(false, place.markerVariant),
      });
      if (place.source === "GOOGLE") {
        // External: open a Google-Maps-CTA InfoWindow; no booking, no profile.
        // Clear any internal highlight so a stale list card isn't left active.
        marker.addListener("click", () => {
          onActivate(null);
          infoWindow.setContent(buildExternalInfoContent(place));
          infoWindow.open({ map, anchor: marker });
        });
      } else {
        // Internal: existing highlight + pan behavior.
        marker.addListener("click", () => {
          infoWindow.close();
          onActivate(place.id);
        });
        marker.addListener("mouseover", () => onActivate(place.id));
        marker.addListener("mouseout", () => onActivate(null));
      }
      markersById.set(place.id, { marker, place });
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
    markersRef.current.forEach(({ marker, place }, id) => {
      const isActive = id === activeId;
      marker.setIcon(markerIcon(isActive, place.markerVariant));
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
