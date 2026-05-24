"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { accountNavItems } from "./account-nav-items";

export function AccountSidebarNav() {
  return <SidebarNav items={accountNavItems} />;
}
