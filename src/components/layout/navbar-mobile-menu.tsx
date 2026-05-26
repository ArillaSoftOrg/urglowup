"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavbarMobileMenuProps {
  navLink: { label: string; href: string };
  exploreHref: string;
  exploreLabel: string;
  openMenuLabel: string;
}

export function NavbarMobileMenu({
  navLink,
  exploreHref,
  exploreLabel,
  openMenuLabel,
}: NavbarMobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={openMenuLabel} />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="border-b p-4">
          <SheetTitle className="text-base font-bold tracking-tight">
            UrGlowUp
          </SheetTitle>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <Link
            href={exploreHref}
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {exploreLabel}
          </Link>
          <Link
            href={navLink.href}
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {navLink.label}
          </Link>
        </nav>
        <div className="border-t px-3 pt-3 pb-2">
          <LocaleSwitcher />
        </div>
      </SheetContent>
    </Sheet>
  );
}
