"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

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

interface BusinessMapProps {
  lat: number;
  lng: number;
  name: string;
  apiKey: string;
}

export function BusinessMap({ lat, lng, name, apiKey }: BusinessMapProps) {
  const { isLoaded, loadError: sdkError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    language: "tr",
  });

  if (sdkError) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-surface-cream">
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
    return <div className="h-48 w-full animate-pulse rounded-xl bg-surface-cream" />;
  }

  const center = { lat, lng };

  return (
    <GoogleMap
      mapContainerClassName="w-full h-48 rounded-xl overflow-hidden"
      center={center}
      zoom={15}
      options={mapOptions}
    >
      <MarkerF position={center} title={name} />
    </GoogleMap>
  );
}
