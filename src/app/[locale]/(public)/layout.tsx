import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Locale } from "@/lib/i18n-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function LocalePublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { locale } = await params;
  return (
    <>
      <Navbar locale={locale as Locale} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
