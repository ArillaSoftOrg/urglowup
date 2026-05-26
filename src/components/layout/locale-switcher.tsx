"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { useTransition } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { updateLocalePreference } from "@/app/(customer)/account/actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const LOCALES = ["tr", "en", "de", "ru", "es"] as const;
type Locale = (typeof LOCALES)[number];

const LABELS: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  es: "Español",
};

const LOCALE_CODES: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  de: "DE",
  ru: "RU",
  es: "ES",
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

interface LocaleSwitcherProps {
  isLoggedIn?: boolean;
}

export function LocaleSwitcher({ isLoggedIn = false }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const [, startTransition] = useTransition();
  const currentLocale = (params.locale as Locale | undefined) ?? "tr";

  function switchLocale(target: Locale) {
    const targetPath = getLocalizedPath(pathname, currentLocale, target);

    if (isLoggedIn) {
      startTransition(async () => {
        await updateLocalePreference(target);
        router.push(targetPath);
      });
    } else {
      document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; SameSite=Lax`;
      router.push(targetPath);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />
        }
        aria-label="Dil seçin"
      >
        <Globe className="size-3.5 shrink-0" />
        <span>{LOCALE_CODES[currentLocale]}</span>
        <ChevronDown className="size-2.5 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[140px]">
        {LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onClick={() => switchLocale(locale)}>
            {LABELS[locale]}
            {locale === currentLocale && (
              <Check className="ml-auto size-3.5 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
