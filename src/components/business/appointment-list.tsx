"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarCheck, Clock, CalendarDays, Timer } from "lucide-react";
import { AppointmentActions } from "./appointment-actions";
import {
  STATUS_LABELS,
  STATUS_VARIANTS,
  TERMINAL_STATUSES,
} from "@/lib/constants/booking";
import type { BusinessAppointment } from "@/lib/queries/appointments";
import { cn } from "@/lib/utils";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function AppointmentCard({
  appointment,
}: {
  appointment: BusinessAppointment;
}) {
  const isPending = appointment.status === "PENDING";

  return (
    <Card className={cn(isPending && "bg-surface-pink/30")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-9">
              <AvatarImage src={appointment.customer.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(
                  appointment.customer.firstName,
                  appointment.customer.lastName
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  {appointment.customer.firstName}{" "}
                  {appointment.customer.lastName}
                </p>
                <Badge variant={STATUS_VARIANTS[appointment.status]}>
                  {STATUS_LABELS[appointment.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {appointment.service.name}
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
                  <Timer className="size-3" />
                  {appointment.service.durationMinutes} dk
                </span>
              </div>
              {appointment.customer.email && (
                <p className="text-xs text-muted-foreground">
                  {appointment.customer.email}
                </p>
              )}
              {appointment.customerNote && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Müşteri notu:</span>{" "}
                  {appointment.customerNote}
                </p>
              )}
              {appointment.businessNote && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">İşletme notu:</span>{" "}
                  {appointment.businessNote}
                </p>
              )}
            </div>
          </div>
          <AppointmentActions
            appointmentId={appointment.id}
            status={appointment.status}
            businessNote={appointment.businessNote}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessAppointmentList({
  appointments,
  defaultTab,
}: {
  appointments: BusinessAppointment[];
  defaultTab?: string;
}) {
  const pending = appointments.filter((a) => a.status === "PENDING");
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED");
  const past = appointments.filter((a) => TERMINAL_STATUSES.includes(a.status));

  const sortAsc = (a: BusinessAppointment, b: BusinessAppointment) =>
    new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
  const sortDesc = (a: BusinessAppointment, b: BusinessAppointment) =>
    new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime();

  pending.sort(sortAsc);
  confirmed.sort(sortAsc);
  past.sort(sortDesc);

  return (
    <Tabs defaultValue={defaultTab ?? "pending"}>
      <div className="overflow-x-auto">
        <TabsList className="flex-nowrap">
          <TabsTrigger value="pending">
            Bekleyen ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Onaylanan ({confirmed.length})
          </TabsTrigger>
          <TabsTrigger value="all">Tümü ({appointments.length})</TabsTrigger>
          <TabsTrigger value="past">Geçmiş ({past.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pending" className="mt-4 space-y-3">
        {pending.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarDays}
            headline="Bekleyen talep yok"
            description="Yeni randevu talepleri burada görünür."
          />
        ) : (
          pending.map((a) => <AppointmentCard key={a.id} appointment={a} />)
        )}
      </TabsContent>

      <TabsContent value="confirmed" className="mt-4 space-y-3">
        {confirmed.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarDays}
            headline="Onaylanan randevu yok"
            description="Onayladığınız randevular burada görünür."
          />
        ) : (
          confirmed.map((a) => <AppointmentCard key={a.id} appointment={a} />)
        )}
      </TabsContent>

      <TabsContent value="all" className="mt-4 space-y-3">
        {appointments.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarDays}
            headline="Henüz randevu yok"
            description="Müşteri randevu talepleri burada görünür."
          />
        ) : (
          [...appointments]
            .sort(sortDesc)
            .map((a) => <AppointmentCard key={a.id} appointment={a} />)
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4 space-y-3">
        {past.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarDays}
            headline="Geçmiş randevu yok"
            description="Tamamlanan ve iptal edilen randevular burada görünür."
          />
        ) : (
          past.map((a) => <AppointmentCard key={a.id} appointment={a} />)
        )}
      </TabsContent>
    </Tabs>
  );
}
