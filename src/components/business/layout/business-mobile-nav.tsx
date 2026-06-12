"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { meetsMinRole } from "@/lib/permissions";
import { BusinessMemberRole } from "@/generated/prisma/enums";
import { businessNavItems } from "./business-nav-items";

const MOBILE_NAV_HREFS = [
  "/business/dashboard",
  "/business/appointments",
  "/business/messages",
  "/business/customers",
  "/business/profile",
];

export function BusinessMobileNav({
  memberRole,
}: {
  memberRole: BusinessMemberRole;
}) {
  const pathname = usePathname();
  const mobileNavItems = businessNavItems.filter(
    (item) =>
      MOBILE_NAV_HREFS.includes(item.href) &&
      meetsMinRole(memberRole, item.minRole ?? BusinessMemberRole.STAFF)
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/96 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_oklch(0.16_0.09_285_/_0.10)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium leading-none transition-colors",
                isActive
                  ? "bg-brand-pink/15 text-brand-pink-foreground"
                  : "text-muted-foreground hover:bg-surface-cream hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
