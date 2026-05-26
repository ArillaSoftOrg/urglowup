"use client";

import { usePathname, useRouter, useParams } from "next/navigation";

const LOCALES = ["tr", "en", "de", "ru", "es"] as const;
type Locale = (typeof LOCALES)[number];

const LABELS: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  es: "Español",
};

function getLocalizedPath(
  pathname: string,
  currentLocale: Locale,
  targetLocale: Locale,
): string {
  let basePath = pathname;
  if (currentLocale !== "tr") {
    const prefix = `/${currentLocale}`;
    basePath = pathname.startsWith(prefix)
      ? pathname.slice(prefix.length) || "/"
      : pathname;
  }
  if (targetLocale === "tr") return basePath;
  return `/${targetLocale}${basePath === "/" ? "" : basePath}`;
}

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params.locale as Locale | undefined) ?? "tr";

  function switchLocale(target: Locale) {
    document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; SameSite=Lax`;
    router.push(getLocalizedPath(pathname, currentLocale, target));
  }

  return (
    <div className="flex items-center gap-0.5">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
            locale === currentLocale
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={`Switch to ${LABELS[locale]}`}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
