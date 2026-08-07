"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { normalizeServiceCategory } from "@/lib/service-categories";
import { cn } from "@/lib/utils";
import { CalendarCheck, Clock, Scissors } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

const FEATURED_CATEGORY = "Öne Çıkanlar";

function formatPrice(service: BusinessWithDetails["services"][number]): {
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

export function ServicesSection({
  business,
}: {
  business: BusinessWithDetails;
}) {
  const [activeCategory, setActiveCategory] = useState(FEATURED_CATEGORY);
  const categories = Array.from(
    new Set(business.services.map((service) => normalizeServiceCategory(service.category)))
  );
  const visibleServices =
    activeCategory === FEATURED_CATEGORY
      ? business.services
      : business.services.filter(
          (service) => normalizeServiceCategory(service.category) === activeCategory
        );

  return (
    <section className="scroll-mt-[106px] space-y-5 md:scroll-mt-[130px]" id="services">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-normal">Hizmetler</h2>
          {business.services.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {business.services.length} hizmet mevcut
            </p>
          )}
        </div>

        {business.services.length > 0 && (
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {[FEATURED_CATEGORY, ...categories].map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center rounded-full px-5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "border border-border bg-background text-foreground hover:bg-muted/50"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {business.services.length === 0 ? (
        <div className="rounded-lg border bg-background p-6">
          <EmptyState
            icon={Scissors}
            headline="Henüz hizmet eklenmedi"
            description="Bu işletme yakında hizmetlerini ekleyecek."
            surface="cream"
            compact
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="divide-y">
            {visibleServices.map((service) => {
              const { amount, qualifier } = formatPrice(service);
              return (
                <Link
                  key={service.id}
                  href={`/b/${business.slug}/book?service=${service.id}`}
                  className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-muted/40 active:bg-muted/60 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div>
                      <p className="text-base font-semibold group-hover:text-primary">{service.name}</p>
                      {service.description && (
                        <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-4" />
                        {service.durationMinutes} dk
                      </span>
                      {amount && (() => {
                        const isOnSale = service.salePrice != null &&
                          (!service.saleEndsAt || new Date(service.saleEndsAt) > new Date());
                        return isOnSale ? (
                          <span className="flex items-center gap-1.5">
                            <span className="font-bold text-destructive">₺{Number(service.salePrice)}</span>
                            <span className="text-xs text-muted-foreground line-through">{amount}</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-foreground">
                            {qualifier && <span className="mr-1 font-normal text-muted-foreground">{qualifier}</span>}
                            {amount}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className={cn(
                      buttonVariants({ variant: "default", size: "default" }),
                      "pointer-events-none w-full shrink-0 gap-1.5 sm:w-auto",
                    )}
                  >
                    <CalendarCheck className="size-4" />
                    Randevu al
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
