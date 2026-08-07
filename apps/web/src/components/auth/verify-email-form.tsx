"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerifyEmailForm({
  redirectTo,
  defaultEmail,
}: {
  redirectTo?: string;
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState(resendVerificationAction, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <AuthFormFeedback message={state.message} tone={state.tone} />

      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaultEmail}
        />
        {state.errors?.email ? (
          <p className="text-sm text-destructive">{state.errors.email}</p>
        ) : null}
      </div>

      <BotProtectionFields />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Doğrulama bağlantısı gönderiliyor..."
          : "Doğrulama bağlantısı gönder"}
      </Button>
    </form>
  );
}
