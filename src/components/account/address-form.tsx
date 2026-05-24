"use client";

import { useActionState } from "react";
import {
  updateServiceAddress,
  type AddressFormState,
} from "@/app/(customer)/account/address/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AddressFormProps {
  defaultValue: string;
}

export function AddressForm({ defaultValue }: AddressFormProps) {
  const [state, formAction, pending] = useActionState<AddressFormState, FormData>(
    updateServiceAddress,
    { success: false }
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            state.success
              ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="serviceAddress">Hizmet adresi</Label>
        <Textarea
          id="serviceAddress"
          name="serviceAddress"
          defaultValue={defaultValue}
          placeholder="Örn: Atatürk Cad. No:12 D:3, Kadıköy / İstanbul"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Bu adres yalnızca eve/konuma servis veren işletmeler tarafından görülebilir.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
