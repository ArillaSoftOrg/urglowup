"use client";

import Script from "next/script";
import { useState } from "react";

export function BotProtectionFields() {
  const [startedAt] = useState(() => Date.now());
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <>
      <input type="hidden" name="formStartedAt" value={startedAt} />
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      {siteKey && (
        <div className="space-y-3 rounded-md border border-border/70 bg-muted/30 p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Güvenlik doğrulaması
            </p>
            <p className="text-xs text-muted-foreground">
              Devam etmeden önce robot olmadığını doğrula.
            </p>
          </div>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div
            className="cf-turnstile"
            data-sitekey={siteKey}
            data-theme="auto"
            data-size="normal"
          />
        </div>
      )}
    </>
  );
}
