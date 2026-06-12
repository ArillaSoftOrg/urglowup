"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { useTransition } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n-config";
import { LOCALE_LABELS, LOCALE_CODES } from "@/lib/i18n-labels";
import { updateLocalePreference } from "@/app/(customer)/account/actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { setClientCookie } from "@/lib/cookies";

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
  variant?: "navbar" | "mobile" | "settings";
  savedLocale?: Locale;
}

export function LocaleSwitcher({
  isLoggedIn = false,
  variant = "navbar",
  savedLocale,
}: LocaleSwitcherProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const params = useParams() ?? {};
  const [, startTransition] = useTransition();
  const currentLocale =
    savedLocale ?? (params.locale as Locale | undefined) ?? "tr";

  function switchLocale(target: Locale) {
    if (variant === "settings") {
      startTransition(async () => {
        if (isLoggedIn) {
          await updateLocalePreference(target);
        } else {
          setClientCookie("NEXT_LOCALE", target, 31536000);
        }
        router.refresh();
      });
      return;
    }

    const targetPath = getLocalizedPath(pathname, currentLocale, target);
    if (isLoggedIn) {
      startTransition(async () => {
        await updateLocalePreference(target);
        router.push(targetPath);
      });
    } else {
      setClientCookie("NEXT_LOCALE", target, 31536000);
      router.push(targetPath);
    }
  }

  if (variant === "settings") {
    return (
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            className={[
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              locale === currentLocale
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
            ].join(" ")}
          >
            {LOCALE_LABELS[locale]}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {SUPPORTED_LOCALES.map((locale) => {
          const active = locale === currentLocale;

          return (
            <button
              key={locale}
              onClick={() => switchLocale(locale)}
              className={[
                "flex min-h-10 items-center justify-between rounded-lg border px-3 text-sm font-medium transition-colors",
                active
                  ? "border-foreground/20 bg-foreground text-background"
                  : "border-border/80 bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
              ].join(" ")}
              aria-current={active ? "true" : undefined}
            >
              <span>{LOCALE_LABELS[locale]}</span>
              <span
                className={[
                  "text-[0.68rem] font-semibold",
                  active ? "text-background/70" : "text-muted-foreground/70",
                ].join(" ")}
              >
                {LOCALE_CODES[locale]}
              </span>
            </button>
          );
        })}
      </div>
    );
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
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onClick={() => switchLocale(locale)}>
            {LOCALE_LABELS[locale]}
            {locale === currentLocale && (
              <Check className="ml-auto size-3.5 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
