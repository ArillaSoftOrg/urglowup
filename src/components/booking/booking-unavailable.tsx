import { CalendarOff, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface BookingUnavailableProps {
  business: { name: string; slug: string };
  reason: "no-services" | "no-hours";
}

export function BookingUnavailable({ business, reason }: BookingUnavailableProps) {
  const description =
    reason === "no-services"
      ? `${business.name} henüz hizmet eklemedi. Yakında tekrar bakın.`
      : `${business.name} henüz çalışma saatlerini belirlemedi. Yakında tekrar bakın.`;

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <EmptyState
          icon={reason === "no-services" ? CalendarOff : Clock}
          headline="Şu an randevu alınamıyor"
          description={description}
          surface="cream"
          action={{
            label: "İşletme profiline dön",
            href: `/b/${business.slug}`,
            variant: "outline",
          }}
        />
      </div>
    </div>
  );
}
