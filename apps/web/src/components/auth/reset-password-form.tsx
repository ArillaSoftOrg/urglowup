"use client";

import { useActionState, useState } from "react";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
import { PasswordInput } from "@/components/shared/password-input";
import { PasswordRequirements } from "@/components/shared/password-requirements";
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
  const [passwordValue, setPasswordValue] = useState("");
  // Snapshot of the password at the moment of last submit. If the live value
  // differs, the user has re-typed and the stale server error is suppressed.
  const [submittedPassword, setSubmittedPassword] = useState<string | null>(null);

  const passwordErrorVisible =
    !!state.errors?.newPassword &&
    !pending &&
    passwordValue === submittedPassword;

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={() => setSubmittedPassword(passwordValue)}
    >
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
          onChange={(e) => setPasswordValue(e.target.value)}
        />
        {passwordErrorVisible ? (
          <p className="text-sm text-destructive">{state.errors?.newPassword}</p>
        ) : (
          <PasswordRequirements password={passwordValue} />
        )}
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
