"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { meetsMinRole } from "@/lib/permissions";
import { BusinessMemberRole } from "@/generated/prisma/enums";
import { businessNavItems } from "./business-nav-items";
import { BusinessMobileNav } from "./business-mobile-nav";
import {
  BusinessNotificationMenu,
  type BusinessNotificationMenuItem,
} from "./business-notification-menu";

const TOP_NAV_HREFS = [
  "/business/dashboard",
  "/business/appointments",
  "/business/messages",
  "/business/customers",
  "/business/profile",
];

export function BusinessSidebar({
  memberRole,
  notifications,
  unreadCount,
}: {
  memberRole: BusinessMemberRole;
  notifications: BusinessNotificationMenuItem[];
  unreadCount: number;
}) {
  const pathname = usePathname();

  const visibleNavItems = businessNavItems.filter((item) =>
    meetsMinRole(memberRole, item.minRole ?? BusinessMemberRole.STAFF)
  );
  const topNavItems = TOP_NAV_HREFS.flatMap((href) =>
    visibleNavItems.filter((item) => item.href === href)
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
          <BusinessNotificationMenu
            notifications={notifications}
            unreadCount={unreadCount}
          />

          <div className="md:hidden">
            <BusinessMobileNav memberRole={memberRole} />
          </div>
        </div>
      </div>
    </header>
  );
}
