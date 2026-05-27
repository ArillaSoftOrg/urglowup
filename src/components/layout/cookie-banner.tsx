"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_MAX_AGE,
  COOKIE_CONSENT_NAME,
  type CookieConsentValue,
} from "@/lib/cookies";

function setConsent(value: CookieConsentValue) {
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax`;
}

export function CookieBanner({ hasConsent }: { hasConsent: boolean }) {
  const [visible, setVisible] = useState(!hasConsent);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-5xl rounded-3xl border border-border/70 bg-background/95 p-4 shadow-lg backdrop-blur md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-1.5">
            <p className="text-sm font-semibold">Cookie kullanimi</p>
            <p className="text-sm text-muted-foreground">
              Siteyi guvenli tutmak, dil tercihini hatirlamak ve deneyimi iyilestirmek
              icin cookie kullaniyoruz. Detaylar icin{" "}
              <Link href="/cookie-policy" className="underline underline-offset-4 hover:text-foreground">
                Cookie Policy
              </Link>{" "}
              ve{" "}
              <Link href="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setConsent("necessary");
                setVisible(false);
              }}
            >
              Sadece gerekli
            </Button>
            <Button
              onClick={() => {
                setConsent("all");
                setVisible(false);
              }}
            >
              Kabul et
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
