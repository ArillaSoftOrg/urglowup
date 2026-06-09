"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminOverrideAppointmentStatus } from "@/app/(admin)/admin/actions";
import type { AdminAppointmentDetail } from "@/lib/queries/admin";
import type { AppointmentStatus } from "@/generated/prisma/enums";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
  CANCELLED_BY_CUSTOMER: "Cancelled by Customer",
  CANCELLED_BY_BUSINESS: "Cancelled by Business",
  COMPLETED: "Completed",
  NO_SHOW: "No Show",
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED_BY_CUSTOMER: "bg-slate-100 text-slate-700",
  CANCELLED_BY_BUSINESS: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  NO_SHOW: "bg-purple-100 text-purple-800",
};

const ALL_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
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
    if (!cancelReason.trim()) {
      setError("Reason is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await adminOverrideAppointmentStatus(
        appointment.id,
        "CANCELLED_BY_BUSINESS",
        cancelReason,
      );
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
          <p className="text-xs font-mono text-slate-400">ID: {appointment.id}</p>
          <p className="text-xs text-slate-500">
            Created {new Date(appointment.createdAt).toLocaleString("en-US")}
          </p>
        </div>
        <Badge className={`self-start text-sm px-3 py-1 ${STATUS_BADGE[appointment.status]}`}>
          {STATUS_LABELS[appointment.status]}
        </Badge>
      </div>

      {/* Status timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 flex-wrap">
            {ALL_STATUSES.map((s, i) => {
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
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    isCurrent
                      ? isCurrentTerminal
                        ? "bg-red-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </span>
              );
            })}
          </div>
          {appointment.cancelledReason && (
            <p className="mt-3 rounded bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-800">
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
            <CardTitle className="text-sm font-semibold text-slate-900">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-slate-900">{customerName}</p>
            <p className="text-slate-600">{appointment.customer.email}</p>
            {appointment.customer.phone && (
              <p className="text-slate-600">{appointment.customer.phone}</p>
            )}
            <a
              href={`/admin/users/${appointment.customer.id}`}
              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
            >
              View user profile →
            </a>
          </CardContent>
        </Card>

        {/* Business + Service */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">Business & Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-slate-900">{appointment.business.name}</p>
            <a
              href={`/admin/businesses/${appointment.business.id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View business →
            </a>
            <p className="mt-2 text-slate-700">
              <span className="font-medium">Service:</span> {appointment.service.name}
            </p>
            <p className="text-slate-600">
              {appointment.service.durationMinutes} min
              {appointment.service.price != null && (
                <> · {appointment.service.price} TL</>
              )}
            </p>
            {appointment.professional && (
              <p className="text-slate-600">
                <span className="font-medium">Professional:</span>{" "}
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
          <CardTitle className="text-sm font-semibold text-slate-900">Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date</p>
              <p className="text-slate-900">{apptDate}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Time</p>
              <p className="text-slate-900">{appointment.requestedTime}</p>
            </div>
          </div>
          {appointment.customerNote && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Customer Note</p>
              <p className="mt-1 rounded bg-slate-50 p-2 text-slate-700">{appointment.customerNote}</p>
            </div>
          )}
          {appointment.businessNote && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Business Note</p>
              <p className="mt-1 rounded bg-slate-50 p-2 text-slate-700">{appointment.businessNote}</p>
            </div>
          )}
          {appointment.review && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Review</p>
              <div className="mt-1 rounded bg-slate-50 p-2">
                <p className="font-medium">Rating: {appointment.review.rating}/5</p>
                {appointment.review.comment && (
                  <p className="text-slate-700 mt-1">{appointment.review.comment}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
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
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700">Cancel Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            {!showCancel ? (
              <button
                onClick={() => setShowCancel(true)}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Cancel this appointment
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  This will set the status to <strong>CANCELLED_BY_BUSINESS</strong> and notify the customer by email.
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (required, visible in audit log)"
                  maxLength={500}
                  disabled={isPending}
                  rows={3}
                  className="w-full rounded border border-slate-300 p-2 text-sm placeholder-slate-400 disabled:bg-slate-100"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-slate-400"
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
                    className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
            <CardTitle className="text-sm font-semibold text-slate-900">Admin Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditLogs.map((log) => {
                const adminName =
                  [log.admin.firstName, log.admin.lastName].filter(Boolean).join(" ") ||
                  log.admin.email;
                return (
                  <div key={log.id} className="rounded bg-slate-50 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-medium text-slate-700">{log.action}</span>
                      <span className="text-slate-400">
                        {new Date(log.createdAt).toLocaleString("en-US")}
                      </span>
                    </div>
                    {log.details && <p className="mt-1 text-slate-600">{log.details}</p>}
                    <p className="mt-1 text-slate-400">by {adminName}</p>
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
