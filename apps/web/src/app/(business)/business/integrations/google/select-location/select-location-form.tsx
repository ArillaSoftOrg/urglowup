"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmLocation } from "./actions";
import type { LocationItem } from "@/app/api/integrations/google/locations/route";

interface SelectLocationFormProps {
  locations: LocationItem[];
}

export function SelectLocationForm({ locations }: SelectLocationFormProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = locations.find((l) => l.locationId === selectedId) ?? null;

  function handleSubmit() {
    if (!selected) return;
    startTransition(async () => {
      await confirmLocation(
        selected.locationId,
        selected.accountId,
        selected.locationName,
        selected.accountName,
        selected.placeId,
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {locations.map((loc) => (
          <label
            key={loc.locationId}
            className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              selectedId === loc.locationId
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input
              type="radio"
              name="location"
              value={loc.locationId}
              checked={selectedId === loc.locationId}
              onChange={() => setSelectedId(loc.locationId)}
              className="mt-1 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-medium truncate">{loc.locationName}</p>
              {loc.accountName && loc.accountName !== loc.locationName && (
                <p className="text-sm text-muted-foreground truncate">
                  {loc.accountName}
                </p>
              )}
              {loc.address && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {loc.address}
                </p>
              )}
              {loc.websiteUri && (
                <p className="text-xs text-muted-foreground truncate">
                  {loc.websiteUri}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selected || isPending}
        className="w-full sm:w-auto"
      >
        {isPending ? "Bağlanıyor..." : "Bu Lokasyonu Bağla"}
      </Button>
    </div>
  );
}
