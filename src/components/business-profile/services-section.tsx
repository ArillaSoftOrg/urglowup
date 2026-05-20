import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Clock, Scissors, CalendarCheck } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="size-5" />
          Hizmetler
        </CardTitle>
        {business.services.length > 0 && (
          <CardDescription>
            {business.services.length} hizmet mevcut
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {business.services.length === 0 ? (
          <EmptyState
            icon={Scissors}
            headline="Henüz hizmet eklenmedi"
            description="Bu işletme yakında hizmetlerini ekleyecek."
            surface="cream"
            compact
          />
        ) : (
          <div className="divide-y divide-border/50">
            {business.services.map((service) => {
              const { amount, qualifier } = formatPrice(service);
              return (
                <div
                  key={service.id}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-base font-semibold">{service.name}</p>
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
                      <div className="flex items-center gap-1.5">
                        {qualifier && (
                          <span className="text-xs text-muted-foreground">{qualifier}</span>
                        )}
                        <span className="text-base font-bold text-foreground">{amount}</span>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <Link
                      href={`/b/${business.slug}/book?service=${service.id}`}
                      className={cn(
                        buttonVariants({ variant: "brand", size: "sm" }),
                        "gap-1.5"
                      )}
                    >
                      <CalendarCheck className="size-3.5" />
                      Randevu Al
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
