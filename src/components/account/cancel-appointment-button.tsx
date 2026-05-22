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

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointment(appointmentId);
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Randevu isteğiniz iptal edilecek. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
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
