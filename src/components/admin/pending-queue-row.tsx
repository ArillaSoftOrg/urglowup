"use client";

import { useState } from "react";
import { adminOverrideAppointmentStatus } from "@/app/(admin)/admin/actions";
import { useTransition } from "react";
import type { AdminPendingAppointment } from "@/lib/queries/admin";

interface PendingQueueRowProps {
  appointment: AdminPendingAppointment & { ageHours: number; isUrgent: boolean };
  ageColor: string;
  ageBadgeColor: string;
  formattedAge: string;
}

type ActionType = "confirm" | "reject" | "cancel" | null;

export function PendingQueueRow({
  appointment,
  ageColor,
  ageBadgeColor,
  formattedAge,
}: PendingQueueRowProps) {
  const [actionInProgress, setActionInProgress] = useState<ActionType>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAction = async (newStatus: "CONFIRMED" | "REJECTED" | "CANCELLED_BY_BUSINESS") => {
    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    startTransition(async () => {
      const result = await adminOverrideAppointmentStatus(appointment.id, newStatus, reason);
      if (!result.success) {
        alert(`Error: ${result.message}`);
      } else {
        setActionInProgress(null);
        setReason("");
      }
    });
  };

  const apptDate = new Date(appointment.requestedDate);
  const apptDateStr = apptDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: apptDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
  const apptTimeStr = `${appointment.requestedTime}`;

  if (actionInProgress) {
    return (
      <div className={`rounded-lg border-l-4 ${ageColor} border p-4`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">{appointment.business.name}</p>
            <p className="text-sm text-slate-600">
              {appointment.customer.firstName} {appointment.customer.lastName}
            </p>
          </div>
          <button
            onClick={() => setActionInProgress(null)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for this action (required)"
          maxLength={500}
          disabled={isPending}
          className="mb-3 w-full rounded border border-slate-300 p-2 text-sm placeholder-slate-500 disabled:bg-slate-100"
          rows={3}
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleAction(actionInProgress === "confirm" ? "CONFIRMED" : actionInProgress === "reject" ? "REJECTED" : "CANCELLED_BY_BUSINESS")}
            disabled={isPending}
            className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isPending ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-l-4 ${ageColor} border p-4`}>
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{appointment.business.name}</p>
            {appointment.isUrgent && (
              <span className="inline-block rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                ⚠ Urgent (&lt;48h)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {appointment.customer.firstName} {appointment.customer.lastName} · {appointment.customer.email}
          </p>
          <p className="text-sm text-slate-600">
            {appointment.service.name} · {apptDateStr} at {apptTimeStr}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${ageBadgeColor}`}>
            {formattedAge}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => setActionInProgress("confirm")}
          className="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Confirm
        </button>
        <button
          onClick={() => setActionInProgress("reject")}
          className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Reject
        </button>
        <button
          onClick={() => setActionInProgress("cancel")}
          className="flex-1 rounded bg-slate-600 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
