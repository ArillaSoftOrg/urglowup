"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_MAX_AGE,
  parseConsentCookie,
  serializeConsentCookie,
  setClientCookie,
  getClientCookie,
} from "@/lib/cookies";
import { CookiePreferencesPanel } from "./cookie-preferences-panel";
import { acknowledgeConsentVersion } from "@/app/(customer)/account/preferences/actions";
import type { Dictionary } from "@/dictionaries/tr";

interface CookieBannerProps {
  /** True when the consent cookie already exists (server-read). */
  hasConsent: boolean;
  /**
   * True when the authenticated user's stored consentVersion is older than the
   * current CONSENT_VERSION. The banner shows a "policy updated" notice and
   * cannot be dismissed without making a fresh choice.
   */
  requiresReConsent?: boolean;
  dict: Dictionary["cookieConsent"];
}

export function CookieBanner({
  hasConsent,
  requiresReConsent = false,
  dict,
}: CookieBannerProps) {
  const [visible, setVisible] = useState(!hasConsent || requiresReConsent);
  const [showPanel, setShowPanel] = useState(false);
  // Lazy initializers: read the existing cookie once at mount so toggle state
  // reflects any prior choice (e.g. when the footer "Cookie Settings" re-opens
  // the banner). SSR-safe — getClientCookie returns undefined on the server.
  const [analytics, setAnalytics] = useState<boolean>(() => {
    const parsed = parseConsentCookie(getClientCookie(COOKIE_CONSENT_NAME));
    return parsed?.analytics ?? false;
  });
  const [marketing, setMarketing] = useState<boolean>(() => {
    const parsed = parseConsentCookie(getClientCookie(COOKIE_CONSENT_NAME));
    return parsed?.marketing ?? false;
  });
  const [, startTransition] = useTransition();

  // Allow the footer "Cookie Settings" button to re-open the banner + panel
  // via a custom DOM event — no URL navigation required.
  useEffect(() => {
    function handleOpen() {
      setVisible(true);
      setShowPanel(true);
    }
    window.addEventListener("urglowup:open-cookie-panel", handleOpen);
    return () =>
      window.removeEventListener("urglowup:open-cookie-panel", handleOpen);
  }, []);

  function applyConsent(prefs: { analytics: boolean; marketing: boolean }) {
    setClientCookie(
      COOKIE_CONSENT_NAME,
      serializeConsentCookie(prefs),
      COOKIE_CONSENT_MAX_AGE,
    );
    // Persist the acknowledged policy version to DB for authenticated users
    // so the re-consent banner stops appearing.
    if (requiresReConsent) {
      startTransition(() => {
        acknowledgeConsentVersion();
      });
    }
    setVisible(false);
    setShowPanel(false);
  }

  function acceptAll() {
    setAnalytics(true);
    setMarketing(true);
    applyConsent({ analytics: true, marketing: true });
  }

  function rejectNonEssential() {
    setAnalytics(false);
    setMarketing(false);
    applyConsent({ analytics: false, marketing: false });
  }

  function savePreferences() {
    applyConsent({ analytics, marketing });
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={dict.bannerTitle}
      aria-modal="false"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
    >
      <div className="mx-auto max-w-5xl rounded-3xl border border-border/70 bg-background/95 p-4 shadow-lg backdrop-blur md:p-5">

        {/* Policy-updated notice — only shown when re-consent is required */}
        {requiresReConsent && (
          <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="font-semibold">{dict.policyUpdatedTitle}</span>
            {" — "}
            {dict.policyUpdatedDesc}
          </div>
        )}

        {/* Main row: description + three equal-weight action buttons */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-1.5">
            <p className="text-sm font-semibold">{dict.bannerTitle}</p>
            <p className="text-sm text-muted-foreground">
              {dict.bannerDescription}{" "}
              <Link
                href="/cookie-policy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Cookie Policy
              </Link>{" "}
              &amp;{" "}
              <Link
                href="/privacy-policy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Reject and Accept are visually balanced (both outline/default sm) */}
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button variant="outline" size="sm" onClick={rejectNonEssential}>
              {dict.rejectNonEssential}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPanel((v) => !v)}
              aria-expanded={showPanel}
              aria-controls="cookie-preferences-panel"
            >
              {dict.managePreferences}
            </Button>
            <Button size="sm" onClick={acceptAll}>
              {dict.acceptAll}
            </Button>
          </div>
        </div>

        {/* Expandable granular preferences panel */}
        {showPanel && (
          <div
            id="cookie-preferences-panel"
            className="mt-4 border-t border-border/40 pt-4"
          >
            <CookiePreferencesPanel
              analytics={analytics}
              marketing={marketing}
              onAnalyticsChange={setAnalytics}
              onMarketingChange={setMarketing}
              onSave={savePreferences}
              onAcceptAll={acceptAll}
              dict={dict}
            />
          </div>
        )}
      </div>
    </div>
  );
}
