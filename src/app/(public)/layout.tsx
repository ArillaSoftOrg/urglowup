import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { ConsentScripts } from "@/components/layout/consent-scripts";
import { COOKIE_CONSENT_NAME } from "@/lib/cookies";
import { CONSENT_VERSION } from "@/lib/consent-version";
import { getDictionary } from "@/lib/get-dictionary";
import { getSession } from "@/lib/auth";
import { getUserPreferences } from "@/lib/preferences";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasConsent = cookieStore.has(COOKIE_CONSENT_NAME);

  // Load Turkish (default locale) dictionary for the banner.
  const dict = await getDictionary("tr");

  // Check whether an authenticated user needs to re-confirm their consent
  // because the CONSENT_VERSION was bumped.
  let requiresReConsent = false;
  const session = await getSession();
  if (session?.user) {
    const prefs = await getUserPreferences(session.user.id);
    requiresReConsent =
      prefs.consentVersion !== null &&
      prefs.consentVersion !== CONSENT_VERSION;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner
        hasConsent={hasConsent}
        requiresReConsent={requiresReConsent}
        dict={dict.cookieConsent}
      />
      <ConsentScripts />
    </>
  );
}
