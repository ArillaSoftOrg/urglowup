"use client";

import { useActionState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  updateCancellationSettings,
  type CancellationSettingsState,
} from "@/app/(business)/business/settings/actions";

export function CancellationSettingsForm({
  cancellationWindowHours,
}: {
  cancellationWindowHours: number;
}) {
  const [state, formAction, pending] = useActionState<
    CancellationSettingsState,
    FormData
  >(updateCancellationSettings, { success: false });

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-surface-cream p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
          <Clock className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">İptal penceresi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Müşterilerin randevularını ücretsiz iptal edebileceği minimum süreyi belirleyin.
            0 girerek iptali tamamen devre dışı bırakabilirsiniz.
          </p>
        </div>
      </div>

      <div className="max-w-xs space-y-2">
        <Label htmlFor="cancellationWindowHours">İptal süresi (saat)</Label>
        <Input
          id="cancellationWindowHours"
          name="cancellationWindowHours"
          type="number"
          min={0}
          max={168}
          defaultValue={cancellationWindowHours}
          aria-invalid={Boolean(state.errors?.cancellationWindowHours)}
        />
        {state.errors?.cancellationWindowHours ? (
          <p className="text-xs text-destructive">{state.errors.cancellationWindowHours}</p>
        ) : (
          <p className="text-xs text-muted-foreground">0 ile 168 saat arasında bir değer girin.</p>
        )}
      </div>

      {state.message && (
        <p className={state.success ? "text-sm text-success-foreground" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        Kaydet
      </Button>
    </form>
  );
}
