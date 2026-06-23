"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Clock, CalendarDays, Star } from "lucide-react";
import Link from "next/link";
import { CancelAppointmentButton } from "./cancel-appointment-button";
import { RescheduleAppointmentDialog } from "./reschedule-appointment-dialog";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  UPCOMING_STATUSES,
  CUSTOMER_CANCELLABLE,
} from "@/lib/constants/booking";
import type { CustomerAppointment } from "@/lib/queries/appointments";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ReviewAction({ appointment }: { appointment: CustomerAppointment }) {
  if (appointment.status !== "COMPLETED") return null;

  const review = appointment.review;

  if (!review) {
    return (
      <Link
        href="/account/reviews"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Star className="size-3" />
        Yorum yaz
      </Link>
    );
  }

  if (review.status === "APPROVED" || review.status === "PENDING") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="size-3 fill-amber-400 text-amber-400" />
        Yorumlandı ({review.rating}/5)
      </span>
    );
  }

  if (review.status === "REMOVED") {
    return (
      <span className="text-xs text-muted-foreground">Yorum kaldırıldı</span>
    );
  }

  // HIDDEN
  return (
    <span className="text-xs text-muted-foreground">Yorum gizlendi</span>
  );
}

function AppointmentCard({
  appointment,
}: {
  appointment: CustomerAppointment;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const canCancel = CUSTOMER_CANCELLABLE.includes(appointment.status);
  const canReschedule = CUSTOMER_CANCELLABLE.includes(appointment.status);
  const effectiveDuration =
    appointment.totalDurationMinutes ?? appointment.service.durationMinutes;

  return (
    <Card key={refreshKey}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <Link
                href={`/b/${appointment.business.slug}`}
                className="text-sm font-medium hover:underline"
              >
                {appointment.business.name}
              </Link>
              <Badge
                className={`text-xs ${STATUS_COLORS[appointment.status]}`}
                variant="outline"
              >
                {STATUS_LABELS[appointment.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {appointment.isGroup
                ? `${appointment.guestCount} kiÅŸilik grup randevusu`
                : appointment.service.name}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarCheck className="size-3" />
                {formatDate(appointment.requestedDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {appointment.requestedTime}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {effectiveDuration} min
              </span>
            </div>
            {appointment.items.length > 0 && (
              <div className="mt-3 space-y-2 rounded-lg bg-surface-cream p-3">
                {appointment.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{item.guestName}</p>
                      <p className="text-muted-foreground">
                        {item.service.name} · {item.durationMinutes} dk
                      </p>
                    </div>
                    {item.priceSnapshot !== null && (
                      <span className="shrink-0 font-medium text-foreground">
                        â‚º{Number(item.priceSnapshot)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {appointment.customerNote && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Notunuz:</span>{" "}
                {appointment.customerNote}
              </p>
            )}
            {appointment.businessNote && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">İşletme notu:</span>{" "}
                {appointment.businessNote}
              </p>
            )}
            {appointment.cancelledReason &&
              (appointment.status === "CANCELLED_BY_CUSTOMER" ||
                appointment.status === "CANCELLED_BY_BUSINESS") && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">İptal sebebi:</span>{" "}
                  {appointment.cancelledReason}
                </p>
              )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {canReschedule && (
              <RescheduleAppointmentDialog
                appointment={appointment}
                onSuccess={() => setRefreshKey((k) => k + 1)}
              />
            )}
            {canCancel && (
              <CancelAppointmentButton appointmentId={appointment.id} />
            )}
            <ReviewAction appointment={appointment} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerAppointmentList({
  appointments,
}: {
  appointments: CustomerAppointment[];
}) {
  const upcoming = appointments
    .filter((a) => UPCOMING_STATUSES.includes(a.status))
    .sort(
      (a, b) =>
        new Date(a.requestedDate).getTime() -
        new Date(b.requestedDate).getTime()
    );

  const past = appointments
    .filter((a) => !UPCOMING_STATUSES.includes(a.status))
    .sort(
      (a, b) =>
        new Date(b.requestedDate).getTime() -
        new Date(a.requestedDate).getTime()
    );

  return (
    <Tabs defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">
          Yaklaşan ({upcoming.length})
        </TabsTrigger>
        <TabsTrigger value="past">Geçmiş ({past.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4 space-y-3">
        {upcoming.length === 0 ? (
          <EmptyState message="Yaklaşan randevu yok" />
        ) : (
          upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} />)
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4 space-y-3">
        {past.length === 0 ? (
          <EmptyState message="Geçmiş randevu yok" />
        ) : (
          past.map((a) => <AppointmentCard key={a.id} appointment={a} />)
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarDays className="size-6" />
        </div>
        <p className="mt-3 text-sm font-medium">{message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            İşletmeleri keşfet
          </Link>{" "}
          randevu almak için
        </p>
      </CardContent>
    </Card>
  );
}
