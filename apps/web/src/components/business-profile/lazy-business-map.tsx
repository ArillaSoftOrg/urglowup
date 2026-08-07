"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

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
  lat?: number;
  lng?: number;
  name: string;
  apiKey: string;
  query?: string;
  className?: string;
}

export function LazyBusinessMap(props: LazyBusinessMapProps) {
  return <BusinessMap {...props} />;
}
