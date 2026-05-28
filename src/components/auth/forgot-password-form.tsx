"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAuthRedirectQuery } from "@/lib/auth-redirect";

export function ForgotPasswordForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <AuthFormFeedback message={state.message} tone={state.tone} />
      {state.success ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          E-posta gelmezse adresi doğru yazdığından emin ol. Henüz hesabın
          yoksa{" "}
          <Link
            href={`/register${buildAuthRedirectQuery(redirectTo)}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            hesap oluşturabilirsin
          </Link>
          .
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
        {state.errors?.email ? (
          <p className="text-sm text-destructive">{state.errors.email}</p>
        ) : null}
      </div>

      <BotProtectionFields />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Bağlantı hazırlanıyor..."
          : "Sıfırlama bağlantısı gönder"}
      </Button>
    </form>
  );
}
