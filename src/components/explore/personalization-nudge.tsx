"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

/**
 * Inline nudge for logged-in users who have not yet granted
 * personalization consent. Shown at the top of the İlham feed.
 * Dismissible for the current session (no persistence needed).
 */
export function PersonalizationNudge() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-pink bg-brand-pink/40 px-4 py-3">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-pink-foreground" />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium text-brand-pink-foreground">
          Akışını kişiselleştir
        </span>{" "}
        <span className="text-brand-pink-foreground/80">
          — İlham akışında tercihlerine uyan içerikleri görmek için{" "}
          <Link
            href="/account/settings#privacy"
            className="underline underline-offset-2 hover:text-brand-pink-foreground transition-colors"
          >
            gizlilik ayarlarından
          </Link>{" "}
          onay ver.
        </span>
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Bildirimi kapat"
        className="shrink-0 rounded p-0.5 text-brand-pink-foreground/50 transition-colors hover:text-brand-pink-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
