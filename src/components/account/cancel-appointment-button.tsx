"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { cancelAppointment } from "@/app/(customer)/account/appointments/actions";

export function CancelAppointmentButton({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointment(appointmentId, reason.trim() || undefined);
      if (!result.success) {
        setError(result.message ?? "Bir hata oluştu.");
      } else {
        setOpen(false);
        setReason("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setError(null); setReason(""); } }}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <X className="size-3" />
        İptal Et
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Randevu iptal edilsin mi?</DialogTitle>
          <DialogDescription>
            Bu işlem geri alınamaz. İsterseniz iptal sebebinizi belirtebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">İptal sebebi (isteğe bağlı)</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Örn. Program değişikliği, acil durum..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            rows={3}
            className="resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Randevuyu koru
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                İptal ediliyor...
              </>
            ) : (
              "Evet, iptal et"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
