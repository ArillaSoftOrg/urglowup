"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({
  token,
  redirectTo,
}: {
  token: string;
  redirectTo?: string;
}) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <AuthFormFeedback message={state.message} tone={state.tone} />

      <div className="space-y-2">
        <Label htmlFor="newPassword">Yeni şifre</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
        />
        {state.errors?.newPassword ? (
          <p className="text-sm text-destructive">{state.errors.newPassword}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Yeni şifre tekrar</Label>
        <PasswordInput
          id="passwordConfirm"
          name="passwordConfirm"
          autoComplete="new-password"
          hideLabel="Sifre tekrarini gizle"
          revealLabel="Sifre tekrarini goster"
        />
        {state.errors?.passwordConfirm ? (
          <p className="text-sm text-destructive">
            {state.errors.passwordConfirm}
          </p>
        ) : null}
      </div>

      <BotProtectionFields />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Şifre güncelleniyor..." : "Şifreyi güncelle"}
      </Button>
    </form>
  );
}
