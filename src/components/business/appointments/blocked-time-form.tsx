"use client";

import { useEffect, useState, useTransition } from "react";
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
import { toDateKey } from "@/lib/calendar";
import {
  CALENDAR_DEFAULT_START_HOUR,
  CALENDAR_DEFAULT_END_HOUR,
  CALENDAR_GENERAL_COLUMN_ID,
} from "@/lib/constants/calendar";
import { createBlockedTime } from "@/app/(business)/business/appointments/actions";
import type { CalendarFormPrefill, CalendarProfessional } from "./types";

const ALL_PROFESSIONALS_VALUE = CALENDAR_GENERAL_COLUMN_ID;

interface BlockedTimeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: CalendarFormPrefill;
  professionals: CalendarProfessional[];
  onSaved: () => void;
}

export function BlockedTimeForm({
  open,
  onOpenChange,
  prefill,
  professionals,
  onSaved,
}: BlockedTimeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional form reset when the dialog opens
    setError(null);
    setProfessionalId(prefill?.professionalId ?? null);
    setDate(prefill?.date ?? toDateKey(new Date()));
    const start = prefill?.startTime ?? `${String(CALENDAR_DEFAULT_START_HOUR).padStart(2, "0")}:00`;
    setStartTime(start);
    const [h, m] = start.split(":").map(Number);
    const endHour = Math.min(h + 1, CALENDAR_DEFAULT_END_HOUR + 4);
    setEndTime(`${String(endHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    setReason("");
  }, [open, prefill]);

  function handleSubmit() {
    setError(null);

    if (!date || !startTime || !endTime) {
      setError("Lütfen tarih ve saat aralığını doldurun.");
      return;
    }
    if (startTime >= endTime) {
      setError("Bitiş saati başlangıç saatinden sonra olmalı.");
      return;
    }

    startTransition(async () => {
      const result = await createBlockedTime({
        professionalId,
        date,
        startTime,
        endTime,
        reason: reason || undefined,
      });

      if (!result.success) {
        setError(result.message ?? "Bir hata oluştu.");
        return;
      }
      onSaved();
      onOpenChange(false);
    });
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Zaman blokla"
      description="Bu aralıkta randevu alınmasını engelleyin (izin, tatil, kapalı saatler)."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Personel</Label>
          <Select
            value={professionalId ?? ALL_PROFESSIONALS_VALUE}
            onValueChange={(v) => setProfessionalId(v === ALL_PROFESSIONALS_VALUE ? null : (v as string))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Personel seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROFESSIONALS_VALUE}>Tüm personel</SelectItem>
              {professionals.map((pro) => (
                <SelectItem key={pro.id} value={pro.id}>
                  {pro.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blocked-date">Tarih</Label>
          <Input id="blocked-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="blocked-start">Başlangıç</Label>
            <Input
              id="blocked-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="blocked-end">Bitiş</Label>
            <Input id="blocked-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blocked-reason">Sebep (opsiyonel)</Label>
          <Textarea
            id="blocked-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Örn. izin, tatil, eğitim..."
            rows={2}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Zamanı blokla
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
