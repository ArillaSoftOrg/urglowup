"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessWithDetails } from "@/lib/queries/business";

const INITIAL_SERVICE_COUNT = 8;

function formatPrice(service: BusinessWithDetails["services"][number]) {
  if (service.priceType === "FREE_CONSULTATION") return "Ücretsiz danışma";
  if (service.priceType === "CONSULTATION_REQUIRED") return "Fiyat için danışın";
  if (!service.price) return null;

  const amount = `₺${Number(service.price)}`;
  return service.priceType === "STARTS_FROM" ? `${amount} itibaren` : amount;
}

export function MobileServicesPreview({
  business,
  hrefPrefix = "",
}: {
  business: BusinessWithDetails;
  hrefPrefix?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = business.services.length > INITIAL_SERVICE_COUNT;
  const visibleServices = showAll || !hasMore
    ? business.services
    : business.services.slice(0, INITIAL_SERVICE_COUNT);

  return (
    <section id="services" className="scroll-mt-[106px] bg-muted/45 px-5 py-8">
      <h2 className="mb-4 text-2xl font-bold tracking-normal text-foreground">Hizmetler</h2>

      <div className="space-y-3">
        {visibleServices.map((service) => {
          const price = formatPrice(service);
          return (
            <Link
              key={service.id}
              href={`${hrefPrefix}/b/${business.slug}/book?service=${service.id}`}
              className={cn(
                "group flex min-h-[98px] items-center justify-between gap-4 rounded-xl",
                "border border-border/80 bg-background px-4 py-4 shadow-xs",
                "transition-colors hover:bg-background active:bg-muted/40",
              )}
            >
              <div className="min-w-0 self-stretch">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {service.name}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm leading-none text-muted-foreground">
                  <Clock className="size-3.5" />
                  {service.durationMinutes} dk
                </p>
                {price && (
                  <p className="mt-3 text-sm font-bold leading-none text-foreground">
                    {price}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors group-hover:border-foreground/25">
                Rezervasyon
              </span>
            </Link>
          );
        })}
      </div>

      {hasMore && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-bold text-foreground shadow-xs transition-colors hover:bg-muted/40"
        >
          Tümünü gör
          <ChevronDown className="size-4" />
        </button>
      )}
    </section>
  );
}
