"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAuthRedirectQuery } from "@/lib/auth-redirect";

export function LoginForm({
  redirectTo,
  resetSuccess = false,
  googleEnabled = false,
}: {
  redirectTo?: string;
  resetSuccess?: boolean;
  googleEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(signInAction, {
    success: false,
  });
  const redirectQuery = buildAuthRedirectQuery(redirectTo);

  return (
    <div className="space-y-4">
      {googleEnabled ? (
        <>
          <GoogleSignInButton redirectTo={redirectTo} />
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">veya e-posta ile</span>
            <div className="flex-1 border-t border-border" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      {resetSuccess ? (
        <AuthFormFeedback
          tone="success"
          message="Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz."
        />
      ) : null}

      <AuthFormFeedback message={state.message} tone={state.tone} />

      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
        {state.errors?.email ? (
          <p className="text-sm text-destructive">{state.errors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Şifre</Label>
          <Link
            href={`/forgot-password${redirectQuery}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Şifremi unuttum
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
        />
        {state.errors?.password ? (
          <p className="text-sm text-destructive">{state.errors.password}</p>
        ) : null}
      </div>

      <BotProtectionFields />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Giriş yapılıyor..." : "Giriş yap"}
      </Button>
    </form>
    </div>
  );
}
