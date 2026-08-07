"use client";

/**
 * Footer button that re-opens the cookie banner (with preferences panel expanded)
 * for any user who has already dismissed it.
 *
 * Dispatches a custom DOM event that CookieBanner listens for, avoiding any
 * shared state or URL-param navigation.
 */
export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("urglowup:open-cookie-panel"))
      }
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </button>
  );
}
