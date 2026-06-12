"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Scissors,
  User,
  Loader2,
  Check,
  X,
  LogIn,
  CheckCircle2,
  UserX,
  Ban,
  Pencil,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS } from "@/lib/constants/booking";
import {
  CALENDAR_STATUS_BADGE_VARIANT,
  BLOCKED_TIME_PSEUDO_STATUS,
} from "@/lib/constants/calendar";
import { formatTimeRange } from "./appointment-card";
import {
  confirmAppointment,
  rejectAppointment,
  cancelAppointmentByBusiness,
  completeAppointment,
  markNoShow,
  checkInAppointment,
  updateBusinessNote,
  deleteBlockedTime,
} from "@/app/(business)/business/appointments/actions";
import {
  getAppointmentCustomerName,
  getInitials,
  formatServicePrice,
  type CalendarSelection,
  type SerializedCalendarAppointment,
} from "./types";
import type { AppointmentStatus } from "@/generated/prisma/enums";

interface AppointmentDetailPanelProps {
  selection: CalendarSelection;
  onClose: () => void;
  onEdit: (appointment: SerializedCalendarAppointment) => void;
  onAppointmentStatusChange: (appointmentId: string, status: AppointmentStatus) => void;
  onAppointmentNoteChange: (appointmentId: string, note: string | null) => void;
  onBlockedTimeDeleted: (blockedTimeId: string) => void;
}

export function AppointmentDetailPanel({
  selection,
  onClose,
  onEdit,
  onAppointmentStatusChange,
  onAppointmentNoteChange,
  onBlockedTimeDeleted,
}: AppointmentDetailPanelProps) {
  if (!selection) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <Calendar className="size-8 opacity-40" />
        <p>Detaylarını görmek için bir randevu veya blokaj seçin.</p>
      </div>
    );
  }

  if (selection.kind === "blocked") {
    return (
      <BlockedTimeDetail
        blockedTime={selection.blockedTime}
        onClose={onClose}
        onDeleted={onBlockedTimeDeleted}
      />
    );
  }

  return (
    <AppointmentDetail
      appointment={selection.appointment}
      onClose={onClose}
      onEdit={onEdit}
      onStatusChange={onAppointmentStatusChange}
      onNoteChange={onAppointmentNoteChange}
    />
  );
}

function AppointmentDetail({
  appointment,
  onClose,
  onEdit,
  onStatusChange,
  onNoteChange,
}: {
  appointment: SerializedCalendarAppointment;
  onClose: () => void;
  onEdit: (appointment: SerializedCalendarAppointment) => void;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => void;
  onNoteChange: (appointmentId: string, note: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState(appointment.businessNote ?? "");
  const [noteDirty, setNoteDirty] = useState(false);

  const customerName = getAppointmentCustomerName(appointment);
  const timeRange = formatTimeRange(appointment.requestedTime, appointment.service.durationMinutes);
  const dateLabel = format(new Date(appointment.requestedDate), "d MMMM yyyy, EEEE", { locale: tr });
  const price = formatServicePrice(appointment.service);

  function runStatusAction(
    action: (id: string) => Promise<{ success: boolean; message?: string }>,
    nextStatus: AppointmentStatus
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action(appointment.id);
      if (result.success) {
        onStatusChange(appointment.id, nextStatus);
      } else {
        setError(result.message ?? "Bir hata oluştu.");
      }
    });
  }

  function handleSaveNote() {
    setError(null);
    startTransition(async () => {
      const result = await updateBusinessNote(appointment.id, note);
      if (result.success) {
        onNoteChange(appointment.id, note || null);
        setNoteDirty(false);
      } else {
        setError(result.message ?? "Bir hata oluştu.");
      }
    });
  }

  const canEdit = !["COMPLETED", "NO_SHOW", "REJECTED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS"].includes(
    appointment.status
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border/50 p-4">
        <div className="space-y-1">
          <Badge variant={CALENDAR_STATUS_BADGE_VARIANT[appointment.status]}>
            {STATUS_LABELS[appointment.status]}
          </Badge>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="lg:hidden">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={appointment.customer.avatarUrl ?? undefined} />
            <AvatarFallback>
              {getInitials(appointment.customer.firstName, appointment.customer.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{customerName}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3" /> {appointment.customer.email}
            </p>
            {appointment.customer.phone && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Phone className="size-3" /> {appointment.customer.phone}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Scissors className="size-4 text-muted-foreground" />
            <span className="font-medium">{appointment.service.name}</span>
            {price && <span className="text-muted-foreground">· {price}</span>}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <span>
              {timeRange} ({appointment.service.durationMinutes} dk)
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4" />
            <span>{appointment.professional?.displayName ?? "Genel"}</span>
          </div>
        </div>

        {appointment.customerNote && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Müşteri notu
            </p>
            <p className="rounded-lg bg-muted/50 p-2 text-sm">{appointment.customerNote}</p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            İşletme notu
          </p>
          <Textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteDirty(true);
            }}
            maxLength={500}
            placeholder="Not ekle..."
            rows={3}
          />
          {noteDirty && (
            <Button size="sm" onClick={handleSaveNote} disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Notu kaydet
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/50 p-4">
        {appointment.status === "PENDING" && (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runStatusAction(confirmAppointment, "CONFIRMED")}
            >
              <Check className="size-3.5" /> Onayla
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => runStatusAction(rejectAppointment, "REJECTED")}
            >
              <X className="size-3.5" /> Reddet
            </Button>
          </>
        )}

        {appointment.status === "CONFIRMED" && (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runStatusAction(checkInAppointment, "CHECKED_IN")}
            >
              <LogIn className="size-3.5" /> Geldi
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => runStatusAction(completeAppointment, "COMPLETED")}
            >
              <CheckCircle2 className="size-3.5" /> Tamamlandı
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => runStatusAction(markNoShow, "NO_SHOW")}
            >
              <UserX className="size-3.5" /> Gelmedi
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => runStatusAction(cancelAppointmentByBusiness, "CANCELLED_BY_BUSINESS")}
            >
              <Ban className="size-3.5" /> İptal et
            </Button>
          </>
        )}

        {appointment.status === "CHECKED_IN" && (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runStatusAction(completeAppointment, "COMPLETED")}
            >
              <CheckCircle2 className="size-3.5" /> Tamamlandı
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => runStatusAction(markNoShow, "NO_SHOW")}
            >
              <UserX className="size-3.5" /> Gelmedi
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => runStatusAction(cancelAppointmentByBusiness, "CANCELLED_BY_BUSINESS")}
            >
              <Ban className="size-3.5" /> İptal et
            </Button>
          </>
        )}

        {canEdit && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => onEdit(appointment)}>
            <Pencil className="size-3.5" /> Düzenle / Yeniden planla
          </Button>
        )}
      </div>
    </div>
  );
}

function BlockedTimeDetail({
  blockedTime,
  onClose,
  onDeleted,
}: {
  blockedTime: NonNullable<Extract<CalendarSelection, { kind: "blocked" }>>["blockedTime"];
  onClose: () => void;
  onDeleted: (blockedTimeId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dateLabel = format(new Date(blockedTime.date), "d MMMM yyyy, EEEE", { locale: tr });
  const label = blockedTime.reason || "Bloklu zaman";

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteBlockedTime(blockedTime.id);
      if (result.success) {
        onDeleted(blockedTime.id);
      } else {
        setError(result.message ?? "Bir hata oluştu.");
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border/50 p-4">
        <div className="space-y-1">
          <Badge variant={CALENDAR_STATUS_BADGE_VARIANT[BLOCKED_TIME_PSEUDO_STATUS]}>Bloklu zaman</Badge>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="lg:hidden">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 p-4 text-sm">
        <p className="font-medium">{label}</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4" />
          <span>
            {blockedTime.startTime}–{blockedTime.endTime}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="size-4" />
          <span>{blockedTime.professional?.displayName ?? "Tüm personel"}</span>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex gap-2 border-t border-border/50 p-4">
        <Button size="sm" variant="destructive" disabled={isPending} onClick={handleDelete}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          Blokajı kaldır
        </Button>
      </div>
    </div>
  );
}
