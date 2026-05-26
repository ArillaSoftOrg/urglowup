"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, MessageSquare } from "lucide-react";
import { updateBusinessNote } from "@/app/(business)/business/appointments/actions";

export function AppointmentNoteDialog({
  appointmentId,
  currentNote,
}: {
  appointmentId: string;
  currentNote: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(currentNote ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateBusinessNote(appointmentId, note);
      if (!result.success) {
        setError(result.message ?? "Bir hata oluştu.");
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
          />
        }
      >
        <MessageSquare className="size-4" />
        {currentNote ? "Notu düzenle" : "Not ekle"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İşletme notu</DialogTitle>
          <DialogDescription>
            Size ve müşteriye görünür dahili not ekleyin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="business-note">Not</Label>
          <Textarea
            id="business-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Not ekle..."
          />
          <p className="text-xs text-muted-foreground">
            {note.length}/500 karakter
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Notu kaydet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
