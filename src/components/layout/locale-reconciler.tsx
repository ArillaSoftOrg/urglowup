"use client";

import { useEffect, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n-config";
import { updateLocalePreference } from "@/app/(customer)/account/actions";

interface LocaleReconcilerProps {
  /** The locale stored in the user's DB preferences. null means no preference set. */
  dbLocale: string | null;
}

function getLocalizedPath(pathname: string, from: Locale, to: Locale): string {
  let base = pathname;
  if (from !== "tr") {
    const prefix = `/${from}`;
    base = pathname.startsWith(prefix) ? pathname.slice(prefix.length) || "/" : pathname;
  }
  return to === "tr" ? base : `/${to}${base === "/" ? "" : base}`;
}

export function LocaleReconciler({ dbLocale }: LocaleReconcilerProps) {
  const params = useParams() ?? {};
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const reconciled = useRef(false);

  const currentLocale = (params.locale as Locale | undefined) ?? "tr";

  useEffect(() => {
    if (reconciled.current) return;
    if (!dbLocale || dbLocale === currentLocale) return;
    if (!SUPPORTED_LOCALES.includes(dbLocale as Locale)) return;

    reconciled.current = true;
    const target = dbLocale as Locale;

    updateLocalePreference(target).then(() => {
      router.push(getLocalizedPath(pathname, currentLocale, target));
    });
  }, [dbLocale, currentLocale, pathname, router]);

  return null;
}
