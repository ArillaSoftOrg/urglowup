import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocationPinIcon({ className }: { className?: string }) {
  return (
    <MapPin
      aria-hidden="true"
      className={cn("size-5 shrink-0 text-foreground", className)}
    />
  );
}
