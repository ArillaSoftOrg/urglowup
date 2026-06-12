"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { accountNavItems } from "./account-nav-items";

export function AccountTopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:block sticky top-[4.5rem] z-40 border-b border-border bg-surface-cream">
      <div className="container mx-auto flex items-center gap-1 overflow-x-auto px-4 md:px-6">
        {accountNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/account"
              ? pathname === "/account"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 border-b-2 -mb-px px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand-pink-foreground bg-brand-pink/10 text-brand-pink-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
