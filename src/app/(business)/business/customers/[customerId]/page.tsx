import { notFound } from "next/navigation";
import Link from "next/link";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { CustomerNoteForm } from "@/components/business/customer-note-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, CalendarCheck, Mail, Phone, StickyNote } from "lucide-react";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "neutral" | "secondary" | "info"> = {
  COMPLETED: "success",
  CONFIRMED: "info",
  PENDING: "warning",
  REJECTED: "destructive",
  CANCELLED_BY_CUSTOMER: "neutral",
  CANCELLED_BY_BUSINESS: "neutral",
  CHECKED_IN: "info",
  NO_SHOW: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Tamamlandı",
  CONFIRMED: "Onaylandı",
  PENDING: "Beklemede",
  REJECTED: "Reddedildi",
  CANCELLED_BY_CUSTOMER: "Müşteri iptali",
  CANCELLED_BY_BUSINESS: "İşletme iptali",
  CHECKED_IN: "Geldi",
  NO_SHOW: "Gelmedi",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface PageProps {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;
  const { businessId } = await requireBusiness();

  const [customer, appointments, note] = await Promise.all([
    db.user.findUnique({
      where: { id: customerId },
      select: { firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    }),
    db.appointment.findMany({
      where: { businessId, customerId },
      include: {
        service: { select: { name: true, price: true, priceType: true } },
        professional: { select: { displayName: true } },
      },
      orderBy: { requestedDate: "desc" },
    }),
    db.businessCustomerNote.findUnique({
      where: { businessId_customerId: { businessId, customerId } },
      select: { note: true },
    }),
  ]);

  if (!customer || appointments.length === 0) notFound();

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Bilinmeyen Müşteri";
  const initials = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const totalSpend = appointments
    .filter((a) => a.status === "COMPLETED" && a.service.price)
    .reduce((sum, a) => sum + Number(a.service.price), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/business/customers"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <BusinessPageHeader title="Müşteri Detayı" description={fullName} />
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-wrap items-start gap-5 p-6">
          <Avatar className="size-16 shrink-0">
            <AvatarFallback className="text-xl font-bold">{initials || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-xl font-bold">{fullName}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" /> {customer.email}
            </p>
            {customer.phone && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" /> {customer.phone}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Üye olma: {formatDate(customer.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{appointments.length}</p>
            <p className="text-xs text-muted-foreground">Toplam randevu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Tamamlanan</p>
          </CardContent>
        </Card>
        {totalSpend > 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">₺{totalSpend}</p>
              <p className="text-xs text-muted-foreground">Toplam harcama</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="size-4" />
            İşletme Notu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerNoteForm customerId={customerId} initialNote={note?.note ?? ""} />
        </CardContent>
      </Card>

      {/* Appointment history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="size-4" />
            Randevu Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {appointments.map((apt) => (
              <li key={apt.id} className="flex flex-wrap items-center gap-3 px-6 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{apt.service.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(apt.requestedDate)} · {apt.requestedTime}
                    {apt.professional && ` · ${apt.professional.displayName}`}
                  </p>
                </div>
                {apt.service.price && apt.status === "COMPLETED" && (
                  <span className="shrink-0 text-sm font-semibold">₺{Number(apt.service.price)}</span>
                )}
                <Badge variant={STATUS_VARIANTS[apt.status] ?? "secondary"} className="shrink-0">
                  {STATUS_LABELS[apt.status] ?? apt.status}
                </Badge>
                <Link
                  href={`/business/appointments?appointmentId=${apt.id}`}
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  Görüntüle
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
