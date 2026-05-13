"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingBusiness } from "@/lib/queries/appointments";

type Service = BookingBusiness["services"][number];

function formatPrice(service: Service) {
  if (service.priceType === "FREE_CONSULTATION") return "Free consultation";
  if (service.priceType === "CONSULTATION_REQUIRED")
    return "Price on consultation";
  if (!service.price) return null;
  const amount = `$${Number(service.price)}`;
  if (service.priceType === "STARTS_FROM") return `From ${amount}`;
  return amount;
}

export function ServicePicker({
  services,
  selectedId,
  onSelect,
}: {
  services: Service[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Select a service</h2>
        <p className="text-sm text-muted-foreground">
          Choose the service you&apos;d like to book
        </p>
      </div>
      <div className="space-y-2">
        {services.map((service) => {
          const price = formatPrice(service);
          const isSelected = selectedId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
              className="w-full text-left"
            >
              <Card
                className={cn(
                  "cursor-pointer transition-colors hover:bg-accent/50",
                  isSelected && "border-primary bg-primary/5"
                )}
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{service.name}</p>
                      {isSelected && (
                        <Check className="size-4 text-primary" />
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {service.durationMinutes} min
                    </div>
                  </div>
                  {price && (
                    <Badge variant="secondary" className="shrink-0">
                      {price}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
