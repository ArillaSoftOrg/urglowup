"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <AuthFormFeedback message={state.message} tone={state.tone} />

      <div className="space-y-2">
        <Label htmlFor="newPassword">Yeni şifre</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-11"
          />
          <button
            type="button"
            aria-label={showPassword ? "Sifreyi gizle" : "Sifreyi goster"}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {state.errors?.newPassword ? (
          <p className="text-sm text-destructive">{state.errors.newPassword}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Yeni şifre tekrar</Label>
        <div className="relative">
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type={showPasswordConfirm ? "text" : "password"}
            autoComplete="new-password"
            className="pr-11"
          />
          <button
            type="button"
            aria-label={
              showPasswordConfirm ? "Sifre tekrarini gizle" : "Sifre tekrarini goster"
            }
            aria-pressed={showPasswordConfirm}
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setShowPasswordConfirm((value) => !value)}
          >
            {showPasswordConfirm ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {state.errors?.passwordConfirm ? (
          <p className="text-sm text-destructive">
            {state.errors.passwordConfirm}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Şifre güncelleniyor..." : "Şifreyi güncelle"}
      </Button>
    </form>
  );
}
