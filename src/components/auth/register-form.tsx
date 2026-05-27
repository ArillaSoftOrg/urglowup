"use client";

import { useActionState } from "react";
import { signUpAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <AuthFormFeedback message={state.message} tone={state.tone} />

      <div className="space-y-2">
        <Label htmlFor="name">Ad soyad</Label>
        <Input id="name" name="name" autoComplete="name" />
        {state.errors?.name ? (
          <p className="text-sm text-destructive">{state.errors.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
        {state.errors?.email ? (
          <p className="text-sm text-destructive">{state.errors.email}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
          />
          {state.errors?.password ? (
            <p className="text-sm text-destructive">{state.errors.password}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Şifre tekrar</Label>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
          />
          {state.errors?.passwordConfirm ? (
            <p className="text-sm text-destructive">
              {state.errors.passwordConfirm}
            </p>
          ) : null}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
      </Button>
    </form>
  );
}
