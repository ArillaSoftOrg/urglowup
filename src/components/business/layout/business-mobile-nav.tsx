"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { businessNavItems } from "./business-nav-items";

export function BusinessMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Menüyü aç" />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex items-center gap-2 border-b p-4">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-pink/20">
            <Sparkles className="size-4 text-brand-pink-foreground" />
          </span>
          <SheetTitle className="text-base font-bold tracking-tight">
            UrGlowUp
          </SheetTitle>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {businessNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-pink/15 text-brand-pink-foreground"
                    : "text-muted-foreground hover:bg-surface-cream hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
