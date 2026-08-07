"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { adminCancelAppointment } from "@/app/(admin)/admin/actions";
import type { AdminAppointmentDetail } from "@/lib/queries/admin";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  REJECTED: "Rejected",
  CANCELLED_BY_CUSTOMER: "Cancelled by Customer",
  CANCELLED_BY_BUSINESS: "Cancelled by Business",
  COMPLETED: "Completed",
  NO_SHOW: "No Show",
};

const STATUS_BADGE_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "info",
  CHECKED_IN: "info",
  REJECTED: "destructive",
  CANCELLED_BY_CUSTOMER: "neutral",
  CANCELLED_BY_BUSINESS: "neutral",
  COMPLETED: "success",
  NO_SHOW: "destructive",
};

const ALL_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "NO_SHOW",
  "REJECTED",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_BUSINESS",
];

interface AppointmentDetailProps {
  data: AdminAppointmentDetail;
}

export function AppointmentDetail({ data }: AppointmentDetailProps) {
  const { appointment, auditLogs } = data;
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCancellable =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  const handleCancel = () => {
    if (cancelReason.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await adminCancelAppointment(appointment.id, cancelReason);
      if (result.success) {
        setShowCancel(false);
        setCancelReason("");
        router.refresh();
      } else {
        setError(result.message ?? "Unknown error.");
      }
    });
  };

  const customerName =
    [appointment.customer.firstName, appointment.customer.lastName]
      .filter(Boolean)
      .join(" ") || appointment.customer.email;

  const apptDate = new Date(appointment.requestedDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-mono text-muted-foreground">ID: {appointment.id}</p>
          <p className="text-xs text-muted-foreground">
            Created {new Date(appointment.createdAt).toLocaleString("en-US")}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[appointment.status]} className="self-start text-sm px-3 py-1">
          {STATUS_LABELS[appointment.status]}
        </Badge>
      </div>

      {/* Status timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 flex-wrap">
            {ALL_STATUSES.map((s) => {
              const isCurrent = s === appointment.status;
              const terminalStatuses: AppointmentStatus[] = [
                "COMPLETED",
                "NO_SHOW",
                "REJECTED",
                "CANCELLED_BY_CUSTOMER",
                "CANCELLED_BY_BUSINESS",
              ];
              const isTerminal = terminalStatuses.includes(appointment.status);
              const isCurrentTerminal = isCurrent && isTerminal;
              return (
                <span
                  key={s}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    isCurrent
                      ? isCurrentTerminal
                        ? "bg-destructive text-primary-foreground"
                        : "bg-info text-info-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {STATUS_LABELS[s]}
                </span>
              );
            })}
          </div>
          {appointment.cancelledReason && (
            <p className="mt-3 rounded bg-destructive/5 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              <span className="font-semibold">Cancellation reason:</span>{" "}
              {appointment.cancelledReason}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Customer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{customerName}</p>
            <p className="text-muted-foreground">{appointment.customer.email}</p>
            {appointment.customer.phone && (
              <p className="text-muted-foreground">{appointment.customer.phone}</p>
            )}
            <a
              href={`/admin/users/${appointment.customer.id}`}
              className="inline-block mt-2 text-xs text-primary hover:underline"
            >
              View user profile →
            </a>
          </CardContent>
        </Card>

        {/* Business + Service */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Business & Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{appointment.business.name}</p>
            <a
              href={`/admin/businesses/${appointment.business.id}`}
              className="text-xs text-primary hover:underline"
            >
              View business →
            </a>
            <p className="mt-2 text-muted-foreground">
              <span className="font-medium text-foreground">Service:</span> {appointment.service.name}
            </p>
            <p className="text-muted-foreground">
              {appointment.service.durationMinutes} min
              {appointment.service.price != null && (
                <> · {appointment.service.price} TL</>
              )}
            </p>
            {appointment.professional && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Professional:</span>{" "}
                {appointment.professional.displayName}
                {appointment.professional.title && ` · ${appointment.professional.title}`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</p>
              <p className="text-foreground">{apptDate}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time</p>
              <p className="text-foreground">{appointment.requestedTime}</p>
            </div>
          </div>
          {appointment.customerNote && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer Note</p>
              <p className="mt-1 rounded bg-muted p-2 text-muted-foreground">{appointment.customerNote}</p>
            </div>
          )}
          {appointment.businessNote && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Business Note</p>
              <p className="mt-1 rounded bg-muted p-2 text-muted-foreground">{appointment.businessNote}</p>
            </div>
          )}
          {appointment.review && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review</p>
              <div className="mt-1 rounded bg-muted p-2">
                <p className="font-medium">Rating: {appointment.review.rating}/5</p>
                {appointment.review.comment && (
                  <p className="text-muted-foreground mt-1">{appointment.review.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Status: {appointment.review.status} ·{" "}
                  {new Date(appointment.review.createdAt).toLocaleDateString("en-US")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Action */}
      {isCancellable && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-destructive">Cancel Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            {!showCancel ? (
              <button
                onClick={() => setShowCancel(true)}
                className="rounded bg-destructive px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-destructive/90"
              >
                Cancel this appointment
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This will set the status to <strong>CANCELLED_BY_BUSINESS</strong> and notify the customer by email.
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation — min 10 characters, visible in audit log"
                  maxLength={500}
                  disabled={isPending}
                  rows={3}
                  className="w-full rounded border border-input p-2 text-sm placeholder:text-muted-foreground disabled:bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {cancelReason.length}/500 characters
                  {cancelReason.length > 0 && cancelReason.length < 10 && (
                    <span className="text-warning-foreground"> · {10 - cancelReason.length} more needed</span>
                  )}
                </p>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="rounded bg-destructive px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {isPending ? "Cancelling…" : "Confirm Cancellation"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCancel(false);
                      setCancelReason("");
                      setError(null);
                    }}
                    disabled={isPending}
                    className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Log */}
      {auditLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Admin Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditLogs.map((log) => {
                const adminName =
                  [log.admin.firstName, log.admin.lastName].filter(Boolean).join(" ") ||
                  log.admin.email;
                return (
                  <div key={log.id} className="rounded bg-muted p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-medium text-foreground">{log.action}</span>
                      <span className="text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("en-US")}
                      </span>
                    </div>
                    {log.details && <p className="mt-1 text-muted-foreground">{log.details}</p>}
                    <p className="mt-1 text-muted-foreground">by {adminName}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
