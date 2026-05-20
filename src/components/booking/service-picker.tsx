"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingBusiness } from "@/lib/queries/appointments";

type Service = BookingBusiness["services"][number];

function formatPrice(service: Service): {
  amount: string | null;
  qualifier: string | null;
} {
  if (service.priceType === "FREE_CONSULTATION")
    return { amount: "Ücretsiz danışma", qualifier: null };
  if (service.priceType === "CONSULTATION_REQUIRED")
    return { amount: "Fiyat için danışın", qualifier: null };
  if (!service.price) return { amount: null, qualifier: null };

  const amount = `₺${Number(service.price)}`;
  if (service.priceType === "STARTS_FROM")
    return { amount, qualifier: "itibaren" };
  return { amount, qualifier: null };
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
        <h2 className="text-lg font-semibold">Hizmet seçin</h2>
        <p className="text-sm text-muted-foreground">
          Hangi hizmet için randevu almak istiyorsunuz?
        </p>
      </div>
      <div className="space-y-2">
        {services.map((service) => {
          const { amount, qualifier } = formatPrice(service);
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
                  "cursor-pointer transition-colors hover:bg-surface-cream",
                  isSelected &&
                    "bg-surface-pink ring-1 ring-brand-pink-foreground/20 hover:bg-surface-pink"
                )}
              >
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold">{service.name}</p>
                      {isSelected && (
                        <Check className="size-4 text-brand-pink-foreground" />
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {service.durationMinutes} dk
                    </div>
                    {amount && (
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        {qualifier && (
                          <span className="text-xs text-muted-foreground">
                            {qualifier}
                          </span>
                        )}
                        <span className="text-base font-bold text-foreground">
                          {amount}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
