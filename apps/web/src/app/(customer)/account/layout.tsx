import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { syncBrowserConsentIfNeeded } from "@/app/(customer)/account/preferences/actions";
import { COOKIE_CONSENT_NAME } from "@/lib/cookies";

/**
 * Account layout — runs on every authenticated account page.
 *
 * Responsibilities:
 * 1. Guards access (redirect to /login if unauthenticated).
 * 2. Syncs browser-cookie consent → DB once (no-op after first sync).
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Sync browser cookie consent → DB for the first time the user visits
  // an account page after having consented via the banner while logged out.
  // syncBrowserConsentIfNeeded is idempotent — it no-ops when already synced.
  const cookieStore = await cookies();
  const consentCookieValue = cookieStore.get(COOKIE_CONSENT_NAME)?.value ?? null;
  if (consentCookieValue) {
    await syncBrowserConsentIfNeeded(consentCookieValue);
  }

  return <>{children}</>;
}
