"use client";

import { useActionState } from "react";
import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  updateGroupBookingSettings,
  type GroupBookingSettingsState,
} from "@/app/(business)/business/settings/actions";

export function GroupBookingSettingsForm({
  maxGroupBookingGuests,
}: {
  maxGroupBookingGuests: number;
}) {
  const [state, formAction, pending] = useActionState<
    GroupBookingSettingsState,
    FormData
  >(updateGroupBookingSettings, { success: false });

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-surface-cream p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
          <UsersRound className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Grup randevularÄ±</p>
          <p className="mt-1 text-sm text-muted-foreground">
            MÃ¼ÅŸterilerin kendileriyle birlikte kaÃ§ misafir iÃ§in hizmet seÃ§ebileceÄŸini belirleyin.
          </p>
        </div>
      </div>

      <div className="max-w-xs space-y-2">
        <Label htmlFor="maxGroupBookingGuests">Maksimum kiÅŸi sayÄ±sÄ±</Label>
        <Input
          id="maxGroupBookingGuests"
          name="maxGroupBookingGuests"
          type="number"
          min={1}
          max={10}
          defaultValue={maxGroupBookingGuests}
          aria-invalid={Boolean(state.errors?.maxGroupBookingGuests)}
        />
        {state.errors?.maxGroupBookingGuests ? (
          <p className="text-xs text-destructive">{state.errors.maxGroupBookingGuests}</p>
        ) : (
          <p className="text-xs text-muted-foreground">1 ile 10 arasÄ±nda bir deÄŸer seÃ§in.</p>
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
