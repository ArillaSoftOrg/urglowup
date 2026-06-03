"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/app/(customer)/account/actions";
import { PasswordInput } from "@/components/shared/password-input";
import { PasswordRequirements } from "@/components/shared/password-requirements";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, {
    success: false,
  });
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState<string | null>(null);

  const newPasswordErrorVisible =
    !!state.errors?.newPassword &&
    !pending &&
    newPasswordValue === submittedPassword;

  if (!hasPassword) {
    return (
      <div className="text-sm text-muted-foreground">
        Bu hesap Google ile giriş yapılarak oluşturuldu. Şifre değiştirme özelliği e-posta/şifre ile giriş yapan hesaplara özeldir.
      </div>
    );
  }

  return (
    <>
      {state.success && (
        <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          {state.message}
        </div>
      )}
      {state.tone === "error" && state.message && !state.errors && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4" onSubmit={() => setSubmittedPassword(newPasswordValue)}>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Mevcut şifre</Label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
          />
          {state.errors?.currentPassword && (
            <p className="text-sm text-destructive">{state.errors.currentPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Yeni şifre</Label>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            onChange={(e) => setNewPasswordValue(e.target.value)}
          />
          {newPasswordErrorVisible ? (
            <p className="text-sm text-destructive">{state.errors?.newPassword}</p>
          ) : (
            <PasswordRequirements password={newPasswordValue} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPasswordConfirm">Yeni şifre tekrar</Label>
          <PasswordInput
            id="newPasswordConfirm"
            name="newPasswordConfirm"
            autoComplete="new-password"
          />
          {state.errors?.newPasswordConfirm && (
            <p className="text-sm text-destructive">{state.errors.newPasswordConfirm}</p>
          )}
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Şifre güncelleniyor..." : "Şifreyi güncelle"}
        </Button>
      </form>
    </>
  );
}
