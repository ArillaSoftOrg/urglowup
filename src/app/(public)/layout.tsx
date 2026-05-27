import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { cookies } from "next/headers";
import { COOKIE_CONSENT_NAME } from "@/lib/cookies";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasConsent = cookieStore.has(COOKIE_CONSENT_NAME);

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner hasConsent={hasConsent} />
    </>
  );
}
