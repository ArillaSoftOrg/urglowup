"use client";

import { COOKIE_CONSENT_NAME } from "@/lib/cookies";

export function CookieResetButton() {
  function handleReset() {
    document.cookie = `${COOKIE_CONSENT_NAME}=; path=/; max-age=0; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <button
      onClick={handleReset}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Çerez Tercihleri
    </button>
  );
}
