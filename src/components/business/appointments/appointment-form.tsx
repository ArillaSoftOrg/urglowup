"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "./responsive-dialog";
import { CustomerPicker } from "./customer-picker";
import { generateTimeSlots } from "@/lib/slots";
import { timeToMinutes, toDateKey } from "@/lib/calendar";
import { getDayOfWeek, BLOCKING_STATUSES } from "@/lib/constants/booking";
import {
  CALENDAR_DEFAULT_START_HOUR,
  CALENDAR_DEFAULT_END_HOUR,
  CALENDAR_GENERAL_COLUMN_ID,
} from "@/lib/constants/calendar";
import {
  createAppointment,
  rescheduleAppointment,
} from "@/app/(business)/business/appointments/actions";
import {
  getAppointmentCustomerName,
  formatServicePrice,
  type CalendarFormPrefill,
  type SerializedCalendarAppointment,
  type SerializedCalendarService,
  type CalendarProfessional,
  type CalendarCustomerSummary,
  type CalendarBlockedTime,
  type CalendarBusinessHour,
} from "./types";

const NO_PROFESSIONAL_VALUE = CALENDAR_GENERAL_COLUMN_ID;

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  prefill?: CalendarFormPrefill;
  appointment?: SerializedCalendarAppointment;
  customers: CalendarCustomerSummary[];
  services: SerializedCalendarService[];
  professionals: CalendarProfessional[];
  appointments: SerializedCalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  businessHours: CalendarBusinessHour[];
  onSaved: () => void;
}

export function AppointmentForm({
  open,
  onOpenChange,
  mode,
  prefill,
  appointment,
  customers,
  services,
  professionals,
  appointments,
  blockedTimes,
  businessHours,
  onSaved,
}: AppointmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional form reset when the dialog opens or switches mode
    setError(null);
    setWarning(null);

    if (mode === "edit" && appointment) {
      setCustomerId(appointment.customer.id);
      setServiceId(appointment.service.id);
      setProfessionalId(appointment.professional?.id ?? null);
      setDate(toDateKey(appointment.requestedDate));
      setStartTime(appointment.requestedTime);
      setNotes(appointment.businessNote ?? "");
    } else {
      setCustomerId(null);
      setServiceId(services[0]?.id ?? "");
      setProfessionalId(prefill?.professionalId ?? null);
      setDate(prefill?.date ?? toDateKey(new Date()));
      setStartTime(prefill?.startTime ?? "");
      setNotes("");
    }
  }, [open, mode, appointment, prefill, services]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const availableSlots = useMemo(() => {
    if (!date || !selectedService) return [];

    const dayOfWeek = getDayOfWeek(date);
    const hour = businessHours.find((h) => h.dayOfWeek === dayOfWeek);
    const openTime =
      hour?.isOpen && hour.openTime ? hour.openTime : `${String(CALENDAR_DEFAULT_START_HOUR).padStart(2, "0")}:00`;
    const closeTime =
      hour?.isOpen && hour.closeTime ? hour.closeTime : `${String(CALENDAR_DEFAULT_END_HOUR).padStart(2, "0")}:00`;
    const interval = hour?.slotIntervalMinutes ?? 30;

    const occupiedAppointments = appointments
      .filter((appt) => {
        if (mode === "edit" && appointment && appt.id === appointment.id) return false;
        if (!BLOCKING_STATUSES.includes(appt.status)) return false;
        if (toDateKey(appt.requestedDate) !== date) return false;
        return appt.professionalId === professionalId;
      })
      .map((appt) => ({
        requestedTime: appt.requestedTime,
        durationMinutes: appt.service.durationMinutes,
      }));

    const occupiedBlocks = blockedTimes
      .filter((b) => {
        if (toDateKey(b.date) !== date) return false;
        return b.professionalId === null || b.professionalId === professionalId;
      })
      .map((b) => ({
        requestedTime: b.startTime,
        durationMinutes: timeToMinutes(b.endTime) - timeToMinutes(b.startTime),
      }));

    return generateTimeSlots(
      openTime,
      closeTime,
      interval,
      selectedService.durationMinutes,
      [...occupiedAppointments, ...occupiedBlocks]
    );
  }, [date, selectedService, businessHours, appointments, blockedTimes, professionalId, mode, appointment]);

  useEffect(() => {
    if (availableSlots.length === 0) return;
    if (!availableSlots.includes(startTime)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keep selected time valid when availability changes
      setStartTime(availableSlots[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSlots]);

  function handleSubmit() {
    setError(null);
    setWarning(null);

    if (mode === "create") {
      if (!customerId) {
        setError("Lütfen bir müşteri seçin.");
        return;
      }
      if (!serviceId || !startTime) {
        setError("Lütfen hizmet ve saat seçin.");
        return;
      }

      startTransition(async () => {
        const result = await createAppointment({
          customerId,
          serviceId,
          professionalId,
          date,
          startTime,
          notes: notes || undefined,
        });

        if (!result.success) {
          setError(result.message ?? "Bir hata oluştu.");
          return;
        }
        onSaved();
        if (result.warning) {
          setWarning(result.warning);
        } else {
          onOpenChange(false);
        }
      });
    } else if (appointment) {
      if (!serviceId || !startTime) {
        setError("Lütfen hizmet ve saat seçin.");
        return;
      }

      startTransition(async () => {
        const result = await rescheduleAppointment({
          appointmentId: appointment.id,
          date,
          startTime,
          professionalId,
          serviceId,
        });

        if (!result.success) {
          setError(result.message ?? "Bir hata oluştu.");
          return;
        }
        onSaved();
        if (result.warning) {
          setWarning(result.warning);
        } else {
          onOpenChange(false);
        }
      });
    }
  }

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerId === customerId) ?? null,
    [customers, customerId]
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Yeni randevu" : "Randevuyu düzenle"}
      description={
        mode === "create"
          ? "Mevcut bir müşteri için randevu oluşturun."
          : "Tarih, saat, hizmet veya personeli güncelleyin."
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Müşteri</Label>
          {mode === "edit" && appointment ? (
            <p className="rounded-lg border border-input p-2 text-sm text-muted-foreground">
              {getAppointmentCustomerName(appointment)}
            </p>
          ) : (
            <CustomerPicker customers={customers} value={customerId} onChange={setCustomerId} />
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Hizmet</Label>
          <Select value={serviceId} onValueChange={(v) => setServiceId(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Hizmet seçin" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => {
                const price = formatServicePrice(service);
                return (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} · {service.durationMinutes} dk
                    {price ? ` · ${price}` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Personel</Label>
          <Select
            value={professionalId ?? NO_PROFESSIONAL_VALUE}
            onValueChange={(v) => setProfessionalId(v === NO_PROFESSIONAL_VALUE ? null : (v as string))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Personel seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROFESSIONAL_VALUE}>Genel (personel atanmadı)</SelectItem>
              {professionals.map((pro) => (
                <SelectItem key={pro.id} value={pro.id}>
                  {pro.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="appointment-date">Tarih</Label>
            <Input
              id="appointment-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Saat</Label>
            <Select value={startTime} onValueChange={(v) => setStartTime(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Saat seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.length === 0 && startTime && (
                  <SelectItem value={startTime}>{startTime}</SelectItem>
                )}
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableSlots.length === 0 && (
              <p className="text-xs text-muted-foreground">Bu gün için uygun saat bulunamadı.</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="appointment-notes">Not</Label>
          <Textarea
            id="appointment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="İşletme notu ekle..."
            rows={3}
          />
        </div>

        {selectedCustomer && mode === "create" && (
          <p className="text-xs text-muted-foreground">
            Seçilen müşteri: {getAppointmentCustomerName({ customer: selectedCustomer.customer })}
          </p>
        )}

        {warning && <p className="text-sm text-warning-foreground">{warning}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {warning ? "Kapat" : "İptal"}
          </Button>
          {!warning && (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {mode === "create" ? "Randevu oluştur" : "Kaydet"}
            </Button>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
