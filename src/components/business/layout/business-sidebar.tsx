"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { businessNavItems } from "./business-nav-items";

export function BusinessSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar p-4">
      <Link
        href="/business/dashboard"
        className="mb-6 flex items-center gap-2 px-2"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand-pink/20">
          <Sparkles className="size-4 text-brand-pink-foreground" />
        </span>
        <span className="text-lg font-bold tracking-tight">UrGlowUp</span>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {businessNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
    </aside>
  );
}
