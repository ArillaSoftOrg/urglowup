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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <Calendar className="size-10 opacity-30" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Randevu seçin</p>
          <p className="text-xs text-muted-foreground">
            Takvimden bir randevu veya bloklu zaman seçerek detaylarını, müşteri bilgilerini ve durum işlemlerini burada yönetin.
          </p>
        </div>
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

function BusinessCancelDialog({
  appointmentId,
  disabled,
  onSuccess,
}: {
  appointmentId: string;
  disabled: boolean;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [localPending, startLocalTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setError(null);
    startLocalTransition(async () => {
      const result = await cancelAppointmentByBusiness(appointmentId, reason.trim() || undefined);
      if (result.success) {
        setOpen(false);
        setReason("");
        onSuccess();
      } else {
        setError(result.message ?? "Bir hata oluştu.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setError(null); setReason(""); } }}>
      <DialogTrigger
        render={<Button size="sm" variant="destructive" disabled={disabled || localPending} />}
      >
        <Ban className="size-3.5" /> İptal et
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Randevu iptal edilsin mi?</DialogTitle>
          <DialogDescription>
            Müşteriye e-posta ile bildirim gönderilecek. İsterseniz iptal sebebini belirtebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="business-cancel-reason">İptal sebebi (isteğe bağlı)</Label>
          <Textarea
            id="business-cancel-reason"
            placeholder="Örn. Personel hastalığı, teknik arıza..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            rows={3}
            className="resize-none"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={localPending}>
            Vazgeç
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={localPending}>
            {localPending ? (
              <><Loader2 className="size-4 animate-spin" /> İptal ediliyor...</>
            ) : (
              "Evet, iptal et"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const effectiveDuration = appointment.totalDurationMinutes ?? appointment.service.durationMinutes;
  const timeRange = formatTimeRange(appointment.requestedTime, effectiveDuration);
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
              {timeRange} ({effectiveDuration} dk)
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4" />
            <span>{appointment.professional?.displayName ?? "Genel"}</span>
          </div>
        </div>

        {appointment.items.length > 0 && (
          <div className="space-y-3 rounded-xl bg-surface-cream p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {appointment.isGroup ? "Grup randevusu" : "Randevu detayÄ±"}
              </p>
              {appointment.firstVisit !== null && (
                <Badge variant="neutral">
                  {appointment.firstVisit ? "Ä°lk ziyaret" : "Tekrar ziyaret"}
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              {appointment.items.map((item) => (
                <div key={item.id} className="border-t border-border/50 pt-3 first:border-t-0 first:pt-0">
                  <p className="text-sm font-medium">{item.guestName}</p>
                  <div className="mt-1 flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p>{item.service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.durationMinutes} dk · {item.professional?.displayName ?? "Tercih yok"}
                      </p>
                    </div>
                    {item.priceSnapshot !== null && (
                      <p className="shrink-0 font-medium">â‚º{item.priceSnapshot}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {appointment.customerNote && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Müşteri notu
            </p>
            <p className="rounded-lg bg-muted/50 p-2 text-sm">{appointment.customerNote}</p>
          </div>
        )}

        {appointment.cancelledReason &&
          (appointment.status === "CANCELLED_BY_CUSTOMER" ||
            appointment.status === "CANCELLED_BY_BUSINESS") && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                İptal sebebi
              </p>
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-sm text-destructive">
                {appointment.cancelledReason}
              </p>
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
            <BusinessCancelDialog
              appointmentId={appointment.id}
              disabled={isPending}
              onSuccess={() => onStatusChange(appointment.id, "CANCELLED_BY_BUSINESS")}
            />
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
            <BusinessCancelDialog
              appointmentId={appointment.id}
              disabled={isPending}
              onSuccess={() => onStatusChange(appointment.id, "CANCELLED_BY_BUSINESS")}
            />
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
