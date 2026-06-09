"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Sparkles,
  Bell,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { businessNavItems } from "./business-nav-items";
import { BusinessMobileNav } from "./business-mobile-nav";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  "/business/public-link",
  "/business/integrations",
  "/business/settings",
];

export function BusinessSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const topNavItems = businessNavItems.filter((item) =>
    TOP_NAV_HREFS.includes(item.href)
  );
  const dropdownItems = businessNavItems.filter((item) =>
    DROPDOWN_HREFS.includes(item.href)
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-business-nav text-business-nav-fg">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/business/dashboard"
          className="flex shrink-0 items-center gap-2"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-pink/20">
            <Sparkles className="size-4 text-brand-pink-foreground" />
          </span>
          <span className="hidden text-base font-bold tracking-tight sm:block">
            UrGlowUp
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {topNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-business-nav-fg"
                    : "text-business-nav-muted hover:bg-white/10 hover:text-business-nav-fg"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Notification bell */}
          <Link
            href="/business/appointments?tab=pending"
            aria-label="Bekleyen randevular"
            className="flex size-8 items-center justify-center rounded-full text-business-nav-muted transition-colors hover:bg-white/10 hover:text-business-nav-fg"
          >
            <Bell className="size-4" />
          </Link>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="flex size-8 items-center justify-center rounded-full bg-brand-pink/25 text-business-nav-fg transition-colors hover:bg-brand-pink/40"
                  aria-label="Hesap menüsü"
                />
              }
            >
              <User className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {dropdownItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="gap-2"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {item.title}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => startTransition(() => signOutAction())}
                className="gap-2"
              >
                <LogOut className="size-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <div className="ml-1 md:hidden">
            <BusinessMobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
