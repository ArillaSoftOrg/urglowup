import { notFound } from "next/navigation";

const INTL_LOCALES = ["en", "de", "ru", "es"] as const;
export type IntlLocale = (typeof INTL_LOCALES)[number];

export function generateStaticParams() {
  return INTL_LOCALES.map((locale) => ({ locale }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { locale } = await params;
  if (!INTL_LOCALES.includes(locale as IntlLocale)) {
    notFound();
  }
  return <>{children}</>;
}
