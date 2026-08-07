import { notFound } from "next/navigation";
import { INTL_LOCALES, type IntlLocale } from "@/lib/i18n-config";

export function generateStaticParams() {
  return INTL_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!INTL_LOCALES.includes(locale as IntlLocale)) {
    notFound();
  }
  return <>{children}</>;
}
