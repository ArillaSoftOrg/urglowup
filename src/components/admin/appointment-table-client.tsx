"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { adminBulkCancelAppointments } from "@/app/(admin)/admin/actions";
import type { AdminAppointment } from "@/lib/queries/admin";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

const STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "REJECTED",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_BUSINESS",
  "COMPLETED",
  "NO_SHOW",
];

interface AppointmentTableClientProps {
  appointments: AdminAppointment[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  formatDate: (date: Date | string) => string;
  formatAge: (createdAt: Date) => string;
  statusLabels: Record<AppointmentStatus, string>;
  statusVariants: Record<AppointmentStatus, BadgeVariant>;
}

export function AppointmentTableClient({
  appointments,
  total,
  page,
  pageSize,
  pageCount,
  formatDate,
  formatAge,
  statusLabels,
  statusVariants,
}: AppointmentTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkReason, setBulkReason] = useState("");
  const [showBulkCancel, setShowBulkCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  const getFilterValue = (key: string): string => {
    return searchParams.get(key) || "";
  };

  const handleStatusFilterChange = (status: AppointmentStatus) => {
    const current = getFilterValue("statuses").split(",").filter(Boolean);
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];

    const params = new URLSearchParams(searchParams);
    if (next.length > 0) {
      params.set("statuses", next.join(","));
    } else {
      params.delete("statuses");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleBusinessNameChange = (name: string) => {
    const params = new URLSearchParams(searchParams);
    if (name) {
      params.set("businessName", name);
    } else {
      params.delete("businessName");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleToggleSelect = (appointmentId: string) => {
    const next = new Set(selectedIds);
    if (next.has(appointmentId)) {
      next.delete(appointmentId);
    } else {
      next.add(appointmentId);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === appointments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(appointments.map((a) => a.id)));
    }
  };

  const handleBulkCancel = async () => {
    if (!bulkReason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    const ids = Array.from(selectedIds);
    startTransition(async () => {
      const result = await adminBulkCancelAppointments(ids, bulkReason);
      if (result.success) {
        setSelectedIds(new Set());
        setBulkReason("");
        setShowBulkCancel(false);
        router.refresh();
      } else {
        alert(`Error: ${result.message}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => {
                  const isSelected = getFilterValue("statuses")
                    .split(",")
                    .includes(status);
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusFilterChange(status)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-foreground mb-2">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                placeholder="Search business..."
                value={getFilterValue("businessName")}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                className="w-full max-w-sm rounded border border-input px-3 py-2 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-info/30 bg-info/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-info-foreground">
                {selectedIds.size} appointment{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
              <button
                onClick={() => setShowBulkCancel(true)}
                className="rounded bg-destructive px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-destructive/90"
              >
                Bulk Cancel
              </button>
            </div>

            {showBulkCancel && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Reason for bulk cancellation (required)"
                  maxLength={500}
                  disabled={isPending}
                  className="w-full rounded border border-input p-2 text-sm placeholder:text-muted-foreground disabled:bg-muted"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkCancel}
                    disabled={isPending}
                    className="rounded bg-destructive px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {isPending ? "Processing..." : "Confirm Bulk Cancel"}
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkCancel(false);
                      setBulkReason("");
                    }}
                    disabled={isPending}
                    className="rounded bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted">
                <tr>
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === appointments.length && appointments.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-input"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Business</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Service</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Appt Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Age</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Notes</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <div className="flex flex-col items-center">
                        <Calendar className="size-8 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">No appointments found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => {
                    const customerName = [
                      appt.customer.firstName,
                      appt.customer.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr key={appt.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(appt.id)}
                            onChange={() => handleToggleSelect(appt.id)}
                            className="rounded border-input"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariants[appt.status]} className="text-xs">
                            {statusLabels[appt.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-foreground">{appt.business.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {customerName || appt.customer.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{appt.service.name}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(appt.requestedDate)} at {appt.requestedTime}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatAge(appt.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                          {appt.businessNote && (
                            <span className="text-xs italic">{appt.businessNote}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/appointments/${appt.id}`}
                            className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="rounded border border-input px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`rounded px-3 py-2 text-sm font-medium ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-input hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pageCount}
                  className="rounded border border-input px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
