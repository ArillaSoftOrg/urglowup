"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { upsertCustomerNote, type NoteActionState } from "@/app/(business)/business/customers/[customerId]/actions";

export function CustomerNoteForm({
  customerId,
  initialNote,
}: {
  customerId: string;
  initialNote: string;
}) {
  const bound = upsertCustomerNote.bind(null, customerId);
  const initial: NoteActionState = { success: false };
  const [state, formAction, isPending] = useActionState(bound, initial);

  return (
    <form action={formAction} className="space-y-2">
      <Textarea
        name="note"
        defaultValue={initialNote}
        placeholder="Bu müşteri hakkında notlarınızı buraya yazın..."
        maxLength={2000}
        rows={4}
        className="resize-none"
      />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="text-xs text-success-foreground">Not kaydedildi.</p>}
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Notu Kaydet"}
      </Button>
    </form>
  );
}
