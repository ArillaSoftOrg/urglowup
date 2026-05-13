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
        setError(result.message ?? "Something went wrong.");
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
        {currentNote ? "Edit note" : "Add note"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Business note</DialogTitle>
          <DialogDescription>
            Add an internal note visible to you and the customer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="business-note">Note</Label>
          <Textarea
            id="business-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Add a note..."
          />
          <p className="text-xs text-muted-foreground">
            {note.length}/500 characters
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
