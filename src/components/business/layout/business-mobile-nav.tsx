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
import { meetsMinRole } from "@/lib/permissions";
import { BusinessMemberRole } from "@/generated/prisma/enums";
import { businessNavItems } from "./business-nav-items";

const PRIMARY_HREFS = [
  "/business/appointments",
  "/business/customers",
  "/business/services",
  "/business/media",
  "/business/posts",
  "/business/profile",
];

const MANAGEMENT_HREFS = [
  "/business/hours",
  "/business/reviews",
  "/business/team",
  "/business/public-link",
  "/business/integrations",
  "/business/settings",
];

export function BusinessMobileNav({
  memberRole,
}: {
  memberRole: BusinessMemberRole;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const visibleNavItems = businessNavItems.filter((item) =>
    meetsMinRole(memberRole, item.minRole ?? BusinessMemberRole.STAFF)
  );
  const primaryItems = visibleNavItems.filter((item) =>
    PRIMARY_HREFS.includes(item.href)
  );
  const managementItems = visibleNavItems.filter((item) =>
    MANAGEMENT_HREFS.includes(item.href)
  );

  const renderNavItems = (items: typeof visibleNavItems) =>
    items.map((item) => {
      const isActive =
        pathname === item.href || pathname.startsWith(item.href + "/");
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
    });

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
        <nav className="flex flex-col gap-4 p-3">
          <div className="space-y-0.5">
            <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
              Ana işler
            </p>
            {renderNavItems(primaryItems)}
          </div>
          <div className="space-y-0.5">
            <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
              Yönetim
            </p>
            {renderNavItems(managementItems)}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
