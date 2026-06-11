"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { meetsMinRole } from "@/lib/permissions";
import { BusinessMemberRole } from "@/generated/prisma/enums";
import { businessNavItems } from "./business-nav-items";
import { BusinessMobileNav } from "./business-mobile-nav";
import { signOutAction } from "@/app/(auth)/actions";

const TOP_NAV_HREFS = [
  "/business/appointments",
  "/business/customers",
  "/business/services",
  "/business/media",
  "/business/posts",
];

const DROPDOWN_HREFS = [
  "/business/profile",
  "/business/hours",
  "/business/reviews",
  "/business/team",
  "/business/public-link",
  "/business/integrations",
  "/business/settings",
];

export function BusinessSidebar({
  memberRole,
}: {
  memberRole: BusinessMemberRole;
}) {
  const pathname = usePathname();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const visibleNavItems = businessNavItems.filter((item) =>
    meetsMinRole(memberRole, item.minRole ?? BusinessMemberRole.STAFF)
  );
  const topNavItems = visibleNavItems.filter((item) =>
    TOP_NAV_HREFS.includes(item.href)
  );
  const dropdownItems = visibleNavItems.filter((item) =>
    DROPDOWN_HREFS.includes(item.href)
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-business-nav text-business-nav-fg shadow-[0_10px_30px_oklch(0.16_0.09_285_/_0.20)]">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-5 px-4 md:px-8 lg:px-10">
        <Link
          href="/business/dashboard"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/10">
            <Sparkles className="size-4 text-[oklch(0.88_0.12_345)]" />
          </span>
          <span className="hidden text-base font-bold tracking-tight sm:block">
            UrGlowUp
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {topNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/14 text-business-nav-fg shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.08)]"
                    : "text-business-nav-muted hover:bg-white/9 hover:text-business-nav-fg"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/business/appointments?tab=pending"
            aria-label="Bekleyen randevular"
            className="relative flex size-9 items-center justify-center rounded-full text-business-nav-muted transition-colors hover:bg-white/10 hover:text-business-nav-fg"
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[oklch(0.68_0.22_345)]" />
          </Link>

          <div className="relative hidden md:block">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-full bg-white/10 pl-1.5 pr-3 text-business-nav-fg ring-1 ring-white/10 transition-colors hover:bg-white/15"
              aria-label="Hesap menüsü"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-[oklch(0.88_0.07_345)] text-[oklch(0.30_0.08_285)]">
                <User className="size-4" />
              </span>
              <span className="hidden text-left leading-tight lg:block">
                <span className="block text-sm font-semibold">Salon Paneli</span>
                <span className="block text-[11px] text-business-nav-muted">
                  İşletme Sahibi
                </span>
              </span>
              <ChevronDown className="size-3.5 text-business-nav-muted" />
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg">
                <p className="px-2 py-2 text-xs font-medium text-muted-foreground">
                  Yönetim
                </p>
                <div className="my-1 h-px bg-border" />
                <div className="space-y-1">
                  {dropdownItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => startTransition(() => signOutAction())}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <BusinessMobileNav memberRole={memberRole} />
          </div>
        </div>
      </div>
    </header>
  );
}
