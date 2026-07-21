"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Globe2, Heart, HelpCircle, LogOut, Menu, MessageCircle, Shield, User } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "./locale-switcher";
import { cn } from "@/lib/utils";
import type { PublicAccountMenuState } from "./public-account-menu-state";

export interface PublicAccountMenuLabels {
  openMenu: string;
  account: string;
  businessPanel: string;
  adminPanel: string;
  forBusiness: string;
  listBusiness: string;
}

interface PublicAccountMenuProps {
  state: PublicAccountMenuState;
  labels: PublicAccountMenuLabels;
  hideExploreLinks?: boolean;
  className?: string;
}

const COPY = {
  tr: {
    menu: "Menü",
    customers: "Müşteriler için",
    signInOrSignUp: "Oturum açın veya kaydolun",
    appointments: "Randevularım",
    favorites: "Favorilerim",
    messages: "Mesajlarım",
    businessLogin: "İşletme girişi",
    editBusinessProfile: "Profilinizi düzenleyin",
    help: "Yardım ve destek",
    language: "Türkçe (TR)",
    signOut: "Çıkış yap",
  },
  en: {
    menu: "Menu",
    customers: "For customers",
    signInOrSignUp: "Sign in or create an account",
    appointments: "My appointments",
    favorites: "My favorites",
    messages: "Messages",
    businessLogin: "Business sign in",
    editBusinessProfile: "Edit your profile",
    help: "Help and support",
    language: "English (EN)",
    signOut: "Sign out",
  },
};

function getCopy(locale: PublicAccountMenuState["locale"]) {
  return locale === "tr" ? COPY.tr : COPY.en;
}

export function PublicAccountMenu({
  state,
  labels,
  hideExploreLinks = false,
  className,
}: PublicAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const copy = getCopy(state.locale);
  const triggerClassName = cn(
    "rounded-full border-border/80 bg-background px-4 font-semibold shadow-xs",
    className,
  );

  return (
    <>
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="lg"
                className={triggerClassName}
                aria-label={labels.openMenu}
              />
            }
          >
            <span>{copy.menu}</span>
            <Menu className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-[19rem] rounded-xl p-0 shadow-lg"
          >
            <MenuPanel
              state={state}
              labels={labels}
              copy={copy}
              hideExploreLinks={hideExploreLinks}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="lg"
                className={triggerClassName}
                aria-label={labels.openMenu}
              />
            }
          >
            <span>{copy.menu}</span>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[min(88vw,22rem)] gap-0 rounded-l-2xl border-border/80 p-0"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <SheetTitle className="text-base font-bold tracking-tight">
                UrGlowUp
              </SheetTitle>
            </div>
            <MenuPanel
              state={state}
              labels={labels}
              copy={copy}
              hideExploreLinks={hideExploreLinks}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function MenuPanel({
  state,
  labels,
  copy,
  hideExploreLinks,
  onNavigate,
}: {
  state: PublicAccountMenuState;
  labels: PublicAccountMenuLabels;
  copy: (typeof COPY)["tr"];
  hideExploreLinks: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-6 px-5 py-5">
      <MenuSection title={copy.customers}>
        {state.isLoggedIn ? (
          <>
            <MenuLink href="/account" icon={<User />} onNavigate={onNavigate}>
              {labels.account}
            </MenuLink>
            <MenuLink href="/account/appointments" icon={<CalendarDays />} onNavigate={onNavigate}>
              {copy.appointments}
            </MenuLink>
            <MenuLink href="/account/favorites" icon={<Heart />} onNavigate={onNavigate}>
              {copy.favorites}
            </MenuLink>
            <MenuLink href="/account/messages" icon={<MessageCircle />} onNavigate={onNavigate}>
              {copy.messages}
            </MenuLink>
          </>
        ) : (
          <MenuLink href="/login" accent onNavigate={onNavigate}>
            {copy.signInOrSignUp}
          </MenuLink>
        )}
      </MenuSection>

      {(state.hasBusinessAccess || !state.isLoggedIn) && !state.isAdmin && (
        <MenuSection title={labels.forBusiness}>
          {state.hasBusinessAccess ? (
            <>
              <MenuLink href="/business/dashboard" icon={<BriefcaseBusiness />} onNavigate={onNavigate}>
                {labels.businessPanel}
              </MenuLink>
              <MenuLink href="/business/profile" icon={<User />} onNavigate={onNavigate}>
                {copy.editBusinessProfile}
              </MenuLink>
            </>
          ) : (
            <>
              <MenuLink href="/login?redirect_url=/business/dashboard" accent onNavigate={onNavigate}>
                {copy.businessLogin}
              </MenuLink>
              <MenuLink href="/business/register" onNavigate={onNavigate}>
                {labels.listBusiness}
              </MenuLink>
            </>
          )}
        </MenuSection>
      )}

      {state.isAdmin && (
        <MenuSection title="Admin">
          <MenuLink href="/admin" icon={<Shield />} onNavigate={onNavigate}>
            {labels.adminPanel}
          </MenuLink>
        </MenuSection>
      )}

      <div className="border-t border-border/70 pt-5">
        {!hideExploreLinks && (
          <MenuLink href="/help" icon={<HelpCircle />} onNavigate={onNavigate}>
            {copy.help}
          </MenuLink>
        )}
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <Globe2 className="size-4" />
          {copy.language}
        </div>
        <div className="mt-3">
          <LocaleSwitcher isLoggedIn={state.isLoggedIn} variant="mobile" />
        </div>
      </div>

      {state.isLoggedIn && (
        <form action={signOutAction} className="border-t border-border/70 pt-4">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <LogOut className="size-4" />
            {copy.signOut}
          </button>
        </form>
      )}
    </div>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold tracking-normal">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function MenuLink({
  href,
  children,
  icon,
  accent = false,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 rounded-lg px-1 py-2 text-base font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        accent
          ? "text-brand-purple-foreground hover:text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="text-foreground [&_svg]:size-4 [&_svg]:shrink-0">
            {icon}
          </span>
        ) : null}
        <span className="truncate">{children}</span>
      </span>
      {accent ? <ArrowRight className="size-4 shrink-0" /> : null}
    </Link>
  );
}
