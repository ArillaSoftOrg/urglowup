"use client";

import { useState, useEffect, useTransition } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { updateThemePreference } from "@/app/(customer)/account/preferences/actions";
import { Theme } from "@/generated/prisma/enums";
import { setClientCookie } from "@/lib/cookies";

type ThemeValue = "LIGHT" | "DARK" | "SYSTEM";

const OPTIONS: { value: ThemeValue; label: string; Icon: React.ElementType }[] =
  [
    { value: "LIGHT", label: "Açık", Icon: Sun },
    { value: "DARK", label: "Koyu", Icon: Moon },
    { value: "SYSTEM", label: "Sistem", Icon: Monitor },
  ];

export function ThemeSelector({ initialTheme }: { initialTheme: ThemeValue }) {
  const [selected, setSelected] = useState<ThemeValue>(initialTheme);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (selected !== "SYSTEM") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = (e: MediaQueryList | MediaQueryListEvent) =>
      document.documentElement.classList.toggle("dark", e.matches);
    sync(mq);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [selected]);

  function handleSelect(theme: ThemeValue) {
    if (theme === "DARK") {
      document.documentElement.classList.add("dark");
    } else if (theme === "LIGHT") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.toggle(
        "dark",
        window.matchMedia("(prefers-color-scheme: dark)").matches,
      );
    }
    setClientCookie("ugl_theme", theme, 31536000);
    setSelected(theme);
    startTransition(() => {
      updateThemePreference(theme as Theme);
    });
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Tema seçimi"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = selected === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            onClick={() => handleSelect(value)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
