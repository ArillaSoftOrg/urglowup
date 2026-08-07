import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomerAppointments } from "@/lib/queries/appointments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreditCard } from "lucide-react";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/lib/constants/booking";

export const metadata = { title: "Ödemeler" };

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price: unknown): string {
  return `₺${Number(price).toLocaleString("tr-TR")}`;
}

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const appointments = await getCustomerAppointments(user.id);
  const priced = appointments.filter((a) => a.totalPrice !== null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ödemeler</h1>
        <p className="text-muted-foreground">
          Randevularınıza ait fiyat geçmişi. UrGlowUp üzerinden tahsil edilen
          bir ödeme kaydı değildir — tutarlar işletmenizle randevu sırasında
          belirlenen fiyatları gösterir.
        </p>
      </div>

      {priced.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          headline="Henüz ödeme geçmişi yok"
          description="Bir randevu tamamladığınızda fiyat bilgisi burada görünecek."
          action={{ label: "İşletmeleri keşfet", href: "/explore" }}
          surface="cream"
        />
      ) : (
        <div className="space-y-3">
          {priced.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {appointment.business.name}
                    </p>
                    <Badge variant={STATUS_VARIANTS[appointment.status]} className="text-xs">
                      {STATUS_LABELS[appointment.status]}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {appointment.service.name} ·{" "}
                    {formatDate(appointment.requestedDate)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatPrice(appointment.totalPrice)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
