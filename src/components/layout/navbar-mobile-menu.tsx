"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Globe2, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavbarMobileMenuProps {
  navLink: { label: string; href: string };
  businessHref: string;
  businessLabel: string;
  listBusinessLabel: string;
  exploreHref: string;
  exploreLabel: string;
  openMenuLabel: string;
  signInLabel: string;
  signUpLabel: string;
  accountLabel: string;
  isLoggedIn?: boolean;
}

export function NavbarMobileMenu({
  navLink,
  businessHref,
  businessLabel,
  listBusinessLabel,
  exploreHref,
  exploreLabel,
  openMenuLabel,
  signInLabel,
  signUpLabel,
  accountLabel,
  isLoggedIn = false,
}: NavbarMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const customerLinks = isLoggedIn
    ? [
        { label: accountLabel, href: "/account" },
        { label: exploreLabel, href: exploreHref },
      ]
    : [
        { label: `${signInLabel} / ${signUpLabel}`, href: "/login", isAccent: true },
        { label: exploreLabel, href: exploreHref },
      ];

  const businessLinks =
    navLink.href === businessHref
      ? [{ label: listBusinessLabel, href: businessHref }]
      : [
          { label: navLink.label, href: navLink.href },
          { label: listBusinessLabel, href: businessHref },
        ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-border/80 bg-background px-4 font-semibold shadow-[0_1px_0_oklch(0.145_0_0/0.04)]"
            aria-label={openMenuLabel}
          />
        }
      >
        <span className="hidden sm:inline">Menü</span>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(88vw,22rem)] gap-0 rounded-l-2xl border-border/80 p-0"
      >
        <div className="flex items-center gap-2 border-b border-border/70 px-5 py-4">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-pink/20">
            <Sparkles className="size-4 text-brand-pink-foreground" />
          </span>
          <SheetTitle className="text-base font-bold tracking-tight">
            UrGlowUp
          </SheetTitle>
        </div>

        <div className="space-y-6 px-5 py-5">
          <MenuSection title="Müşteriler için">
            {customerLinks.map((link) => (
              <MenuLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={isActive(link.href)}
                accent={link.isAccent}
                onClick={() => setOpen(false)}
              />
            ))}
          </MenuSection>

          <MenuSection title={businessLabel}>
            {businessLinks.map((link) => (
              <MenuLink
                key={`${link.href}-${link.label}`}
                href={link.href}
                label={link.label}
                active={isActive(link.href)}
                onClick={() => setOpen(false)}
              />
            ))}
          </MenuSection>

          <div className="border-t border-border/70 pt-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Globe2 className="size-4" />
              Dil
            </div>
            <LocaleSwitcher isLoggedIn={isLoggedIn} variant="mobile" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function MenuLink({
  href,
  label,
  active,
  accent = false,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-lg px-1 py-2 text-base font-medium transition-colors",
        active
          ? "text-foreground"
          : accent
            ? "text-brand-purple-foreground hover:text-foreground"
            : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span>{label}</span>
      {accent ? <ArrowRight className="size-4" /> : null}
    </Link>
  );
}
