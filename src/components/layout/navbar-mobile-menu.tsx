"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  exploreHref: string;
  exploreLabel: string;
  openMenuLabel: string;
  signInLabel: string;
  signUpLabel: string;
  isLoggedIn?: boolean;
}

export function NavbarMobileMenu({
  navLink,
  exploreHref,
  exploreLabel,
  openMenuLabel,
  signInLabel,
  signUpLabel,
  isLoggedIn = false,
}: NavbarMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const links = [
    { label: exploreLabel, href: exploreHref },
    { label: navLink.label, href: navLink.href },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={openMenuLabel} />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex items-center gap-2 border-b p-4">
          <span className="flex size-6 items-center justify-center rounded-md bg-brand-pink/20">
            <Sparkles className="size-3.5 text-brand-pink-foreground" />
          </span>
          <SheetTitle className="text-base font-bold tracking-tight">
            UrGlowUp
          </SheetTitle>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-brand-pink/10 text-brand-pink-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t px-4 py-3">
          <LocaleSwitcher isLoggedIn={isLoggedIn} />
        </div>

        {!isLoggedIn && (
          <div className="border-t p-3 space-y-1.5">
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "brand", size: "sm" }), "w-full")}
            >
              {signUpLabel}
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-start text-muted-foreground")}
            >
              {signInLabel}
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
