"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "@/app/(customer)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  defaultValues: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    { success: false }
  );

  return (
    <form action={formAction} className="space-y-6">
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Ad</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaultValues.firstName}
            placeholder="Adınızı girin"
          />
          {state.errors?.firstName && (
            <p className="text-sm text-destructive">{state.errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Soyad</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaultValues.lastName}
            placeholder="Soyadınızı girin"
          />
          {state.errors?.lastName && (
            <p className="text-sm text-destructive">{state.errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon numarası</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues.phone}
          placeholder="+90 (5XX) XXX XX XX"
        />
        {state.errors?.phone && (
          <p className="text-sm text-destructive">{state.errors.phone}</p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
      </Button>
    </form>
  );
}
