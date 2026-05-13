"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";
import type { AdminAppointment } from "@/lib/queries/admin";

const STATUS_COLORS: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED_BY_CUSTOMER: "bg-red-100 text-red-800",
  CANCELLED_BY_BUSINESS: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED_BY_CUSTOMER: "Cancelled (Customer)",
  CANCELLED_BY_BUSINESS: "Cancelled (Business)",
  NO_SHOW: "No Show",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AppointmentRow({ appointment }: { appointment: AdminAppointment }) {
  const customerName = [
    appointment.customer.firstName,
    appointment.customer.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-center justify-between border-b p-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {customerName || appointment.customer.email}
          </span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-sm">{appointment.business.name}</span>
          <Badge className={`text-xs ${STATUS_COLORS[appointment.status]}`}>
            {STATUS_LABELS[appointment.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {appointment.service.name} &middot;{" "}
          {formatDate(appointment.requestedDate)} at {appointment.requestedTime}
          {appointment.customerNote && (
            <>
              {" "}
              &middot;{" "}
              <span className="italic">
                &quot;{appointment.customerNote}&quot;
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function AppointmentTable({
  appointments,
}: {
  appointments: AdminAppointment[];
}) {
  const pending = appointments.filter(
    (a) => a.status === "PENDING"
  );
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED");
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const cancelled = appointments.filter(
    (a) =>
      a.status === "CANCELLED_BY_CUSTOMER" ||
      a.status === "CANCELLED_BY_BUSINESS"
  );

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        <TabsTrigger value="confirmed">
          Confirmed ({confirmed.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completed.length})
        </TabsTrigger>
        <TabsTrigger value="cancelled">
          Cancelled ({cancelled.length})
        </TabsTrigger>
      </TabsList>

      {[
        { value: "all", items: appointments },
        { value: "pending", items: pending },
        { value: "confirmed", items: confirmed },
        { value: "completed", items: completed },
        { value: "cancelled", items: cancelled },
      ].map(({ value, items }) => (
        <TabsContent key={value} value={value} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Calendar className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No appointments found
                  </p>
                </div>
              ) : (
                items.map((a) => <AppointmentRow key={a.id} appointment={a} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
