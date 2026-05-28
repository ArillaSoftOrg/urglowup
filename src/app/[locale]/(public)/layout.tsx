import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { ConsentScripts } from "@/components/layout/consent-scripts";
import { isProductionLocale, type Locale } from "@/lib/i18n-config";
import { COOKIE_CONSENT_NAME } from "@/lib/cookies";
import { CONSENT_VERSION } from "@/lib/consent-version";
import { getDictionary } from "@/lib/get-dictionary";
import { getSession } from "@/lib/auth";
import { getUserPreferences } from "@/lib/preferences";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isProductionLocale(locale)) {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export default async function LocalePublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const hasConsent = cookieStore.has(COOKIE_CONSENT_NAME);

  // Load the locale-specific dictionary for the banner.
  const dict = await getDictionary(locale as Locale);

  // Check whether an authenticated user needs to re-confirm after a policy update.
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
      <Navbar locale={locale as Locale} />
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
