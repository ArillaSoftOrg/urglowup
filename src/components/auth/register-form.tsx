"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
import { PasswordInput } from "@/components/shared/password-input";
import { PasswordRequirements } from "@/components/shared/password-requirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({
  redirectTo,
  googleEnabled = false,
}: {
  redirectTo?: string;
  googleEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(signUpAction, {
    success: false,
  });
  const [passwordValue, setPasswordValue] = useState("");
  // Snapshot of the password at the moment of last submit. If the live value
  // differs, the user has re-typed and the stale server error is suppressed.
  const [submittedPassword, setSubmittedPassword] = useState<string | null>(null);

  const passwordErrorVisible =
    !!state.errors?.password &&
    !pending &&
    passwordValue === submittedPassword;

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

      <form
        action={formAction}
        className="space-y-4"
        onSubmit={() => setSubmittedPassword(passwordValue)}
      >
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
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            onChange={(e) => setPasswordValue(e.target.value)}
          />
          {passwordErrorVisible ? (
            <p className="text-sm text-destructive">{state.errors?.password}</p>
          ) : (
            <PasswordRequirements password={passwordValue} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Şifre tekrar</Label>
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
      </div>

      <BotProtectionFields />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Hesap oluşturarak{" "}
        <Link href="/kullanim-kosullari" className="underline underline-offset-4 hover:text-foreground">
          Kullanım Koşulları
        </Link>
        &#39;nı ve{" "}
        <Link href="/kvkk" className="underline underline-offset-4 hover:text-foreground">
          KVKK Aydınlatma Metni
        </Link>
        &#39;ni okuduğunuzu kabul etmiş olursunuz.
      </p>
    </form>
    </div>
  );
}
