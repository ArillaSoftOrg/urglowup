"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { signUpAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

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
          <div className="relative">
            <Input
              id="password"
              name="password"
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
          {state.errors?.password ? (
            <p className="text-sm text-destructive">{state.errors.password}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Şifre tekrar</Label>
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
      </div>

      <BotProtectionFields />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Hesap oluşturarak{" "}
        <a href="/kullanim-kosullari" className="underline underline-offset-4 hover:text-foreground">
          Kullanım Koşulları
        </a>
        &#39;nı ve{" "}
        <a href="/kvkk" className="underline underline-offset-4 hover:text-foreground">
          KVKK Aydınlatma Metni
        </a>
        &#39;ni okuduğunuzu kabul etmiş olursunuz.
      </p>
    </form>
    </div>
  );
}
