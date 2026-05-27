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
        <div className="space-y-2">
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div
            className="cf-turnstile"
            data-sitekey={siteKey}
            data-theme="light"
            data-size="normal"
          />
        </div>
      )}
    </>
  );
}
