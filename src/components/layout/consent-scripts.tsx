"use client";

/**
 * Consent-gated script loader (Phase 7 — scaffold).
 *
 * This component reads the structured consent cookie and conditionally injects
 * third-party <Script> tags only when the user has given the relevant consent.
 *
 * Currently no analytics or marketing scripts are installed.
 * When a provider is added, follow the pattern in the comments below.
 *
 * Usage: mount once in (public)/layout.tsx alongside <CookieBanner />.
 */

import { useState } from "react";
import { COOKIE_CONSENT_NAME, parseConsentCookie, type ConsentPrefs } from "@/lib/cookies";

export function ConsentScripts() {
  // Lazy initializer: runs once on mount, SSR-safe (document is undefined on server).
  const [prefs] = useState<ConsentPrefs | null>(() => {
    if (typeof document === "undefined") return null;
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_CONSENT_NAME}=`))
      ?.split("=")[1];
    return parseConsentCookie(cookieValue);
  });

  // prefs === null means: no consent decision yet — render nothing
  if (!prefs) return null;

  return (
    <>
      {/*
       * ── Analytics scripts ──────────────────────────────────────────────────
       * Example (PostHog / Plausible):
       *
       * {prefs.analytics && (
       *   <Script
       *     id="posthog"
       *     strategy="afterInteractive"
       *     dangerouslySetInnerHTML={{ __html: `...posthog init...` }}
       *   />
       * )}
       */}

      {/*
       * ── Marketing / remarketing scripts ────────────────────────────────────
       * Example (Meta Pixel):
       *
       * {prefs.marketing && (
       *   <Script
       *     id="meta-pixel"
       *     strategy="afterInteractive"
       *     dangerouslySetInnerHTML={{ __html: `...fbq init...` }}
       *   />
       * )}
       */}
    </>
  );
}
