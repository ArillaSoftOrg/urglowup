"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
}

interface SidebarNavProps {
  items: NavItem[];
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
            pathname === item.href
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          {item.icon && <item.icon className="size-4 shrink-0" />}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden md:block">
        <NavLinks items={items} pathname={pathname} />
      </div>

      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" aria-label="Hesap menüsü" />
            }
          >
            <Menu className="size-4 mr-2" />
            Menü
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="border-b p-4">
              <SheetTitle className="text-base font-bold tracking-tight">
                Hesabım
              </SheetTitle>
            </div>
            <div className="p-3">
              <NavLinks
                items={items}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
