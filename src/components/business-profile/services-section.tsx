import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { CalendarCheck, Clock, Scissors } from "lucide-react";
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
  const categories = business.categories.map((bc) => bc.category);
  const featuredServices = business.services.slice(0, 3);
  const remainingServices = business.services.slice(3);

  return (
    <section className="space-y-5" id="services">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-normal">Hizmetler</h2>
          {business.services.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {business.services.length} hizmet mevcut
            </p>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 sm:justify-end">
            <span className="inline-flex h-10 shrink-0 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
              Öne Çıkan
            </span>
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex h-10 shrink-0 items-center rounded-full border bg-background px-5 text-sm font-medium"
              >
                {cat.name}
              </span>
            ))}
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
          {featuredServices.length > 0 && (
            <div className="border-b bg-muted/25 px-5 py-3">
              <p className="text-sm font-semibold">Öne çıkan hizmetler</p>
            </div>
          )}

          <div className="divide-y">
            {[...featuredServices, ...remainingServices].map((service) => {
              const { amount, qualifier } = formatPrice(service);
              return (
                <div
                  key={service.id}
                  className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div>
                      <p className="text-base font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-4" />
                        {service.durationMinutes} dk
                      </span>
                      {amount && (
                        <span className="font-semibold text-foreground">
                          {qualifier && (
                            <span className="mr-1 font-normal text-muted-foreground">
                              {qualifier}
                            </span>
                          )}
                          {amount}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/b/${business.slug}/book?service=${service.id}`}
                    className={cn(
                      buttonVariants({ variant: "default", size: "default" }),
                      "w-full shrink-0 gap-1.5 sm:w-auto",
                    )}
                  >
                    <CalendarCheck className="size-4" />
                    Randevu al
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
