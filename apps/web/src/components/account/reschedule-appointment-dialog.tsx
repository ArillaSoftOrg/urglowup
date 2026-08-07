"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Calendar } from "lucide-react";
import { rescheduleAppointment } from "@/app/(customer)/account/appointments/actions";
import { getAvailableSlots } from "@/app/(public)/b/[slug]/book/actions";
import { toDateKey } from "@/lib/calendar";
import type { CustomerAppointment } from "@/lib/queries/appointments";

export function RescheduleAppointmentDialog({
  appointment,
  onSuccess,
}: {
  appointment: CustomerAppointment;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Load available slots when date changes
  const handleDateChange = async (dateStr: string) => {
    setNewDate(dateStr);
    setNewTime("");
    setError(null);

    if (!dateStr) {
      setAvailableSlots([]);
      return;
    }

    setSlotsLoading(true);
    try {
      const slots = await getAvailableSlots(
        appointment.business.id,
        appointment.service.id,
        dateStr
      );
      setAvailableSlots(slots);
      if (slots.length === 0) {
        setError("Bu gün için uygun saat bulunmuyor.");
      }
    } catch (err) {
      console.error("Failed to load slots:", err);
      setError("Saatler yüklenemedi.");
    } finally {
      setSlotsLoading(false);
    }
  };

  function handleReschedule() {
    setError(null);

    if (!newDate || !newTime) {
      setError("Lütfen tarih ve saat seçin.");
      return;
    }

    startTransition(async () => {
      const result = await rescheduleAppointment({
        appointmentId: appointment.id,
        date: newDate,
        time: newTime,
      });

      if (!result.success) {
        setError(result.message ?? "Bir hata oluştu.");
      } else {
        setOpen(false);
        onSuccess();
      }
    });
  }

  const minDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toDateKey(tomorrow);
  })();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Calendar className="size-3" />
        Yeniden planla
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Randevuyu yeniden planlayın</DialogTitle>
          <DialogDescription>
            Randevunuzu yeni bir tarih ve saate taşıyın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-date">Yeni tarih</Label>
            <Input
              id="new-date"
              type="date"
              value={newDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={minDate}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-time">Yeni saat</Label>
            <Select value={newTime || ""} onValueChange={(v) => setNewTime(v || "")} disabled={slotsLoading || isPending}>
              <SelectTrigger id="new-time">
                <SelectValue placeholder={slotsLoading ? "Saatler yükleniyor..." : "Saat seçin"} />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableSlots.length === 0 && newDate && !slotsLoading && (
              <p className="text-xs text-muted-foreground">
                Bu gün için uygun saat yok. Başka bir tarih seçin.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button onClick={handleReschedule} disabled={isPending || !newDate || !newTime}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Planlaniyor...
              </>
            ) : (
              "Yeniden planlayın"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
