"use client";

import { Check, Clock, Plus } from "lucide-react";
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
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            className="min-h-[44px] shrink-0 rounded-full bg-foreground px-5 text-sm font-semibold text-background shadow-sm"
          >
            Öne Çıkanlar
          </button>
          <button
            type="button"
            className="min-h-[44px] shrink-0 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground shadow-xs"
          >
            Tüm hizmetler
          </button>
        </div>
        <h2 className="text-xl font-semibold">Öne Çıkanlar</h2>
      </div>
      <div className="space-y-3 pb-28 lg:pb-0">
        {services.map((service) => {
          const { amount, qualifier } = formatPrice(service);
          const isSelected = selectedId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex min-h-32 w-full items-start rounded-xl border bg-card p-5 text-left shadow-xs transition-all hover:border-foreground/20 hover:shadow-sm sm:min-h-36 sm:p-6",
                isSelected
                  ? "border-brand-purple-foreground/70 ring-2 ring-brand-purple-foreground/80"
                  : "border-border"
              )}
            >
              <div className="min-w-0 pr-14">
                <p className="text-base font-semibold sm:text-lg">{service.name}</p>
                {service.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  {service.durationMinutes} dk
                </div>
                {amount && (
                  <div className="mt-6 flex items-baseline gap-1.5">
                    {qualifier && (
                      <span className="text-sm text-muted-foreground">{qualifier}</span>
                    )}
                    <span className="text-lg font-bold text-foreground">{amount}</span>
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "absolute bottom-5 right-5 flex size-11 items-center justify-center rounded-full border shadow-sm transition-colors",
                  isSelected
                    ? "border-brand-purple-foreground bg-brand-purple-foreground text-background"
                    : "border-border bg-background text-foreground group-hover:bg-surface-cream"
                )}
              >
                {isSelected ? <Check className="size-5" /> : <Plus className="size-5" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
