"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const BusinessMap = dynamic(
  () => import("./business-map").then((mod) => mod.BusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-xl bg-surface-cream">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

interface LazyBusinessMapProps {
  lat: number;
  lng: number;
  name: string;
  apiKey: string;
  className?: string;
}

export function LazyBusinessMap(props: LazyBusinessMapProps) {
  const [showMap, setShowMap] = useState(false);

  if (!showMap) {
    return (
      <div className={props.className ?? "flex h-48 flex-col items-center justify-center rounded-xl bg-surface-cream px-4 text-center"}>
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-pink/15">
          <MapPin className="size-5 text-brand-pink-foreground" />
        </div>
        <p className="mt-2 text-sm font-medium">Haritayi goster</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Google Maps yalnizca ihtiyac oldugunda yuklenecek.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setShowMap(true)}
        >
          Haritayi yukle
        </Button>
      </div>
    );
  }

  return <BusinessMap {...props} />;
}
