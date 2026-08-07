"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CreditCard, Globe2, HelpCircle, LogOut, Menu, Settings, Shield, User } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { LanguageDialog } from "./language-dialog";
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
    payments: "Ödemeler",
    settings: "Ayarlar",
    switchToBusiness: "İşletme Paneline Geç",
    businessLogin: "İşletme girişi",
    help: "Yardım ve destek",
    language: "Türkçe (TR)",
    languageDialogTitle: "Dil seçin",
    signOut: "Çıkış yap",
  },
  en: {
    menu: "Menu",
    customers: "For customers",
    signInOrSignUp: "Sign in or create an account",
    payments: "Payments",
    settings: "Settings",
    switchToBusiness: "Switch to Business Dashboard",
    businessLogin: "Business sign in",
    help: "Help and support",
    language: "English (EN)",
    languageDialogTitle: "Choose language",
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
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
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
              onOpenLanguageDialog={() => setLanguageDialogOpen(true)}
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
              onOpenLanguageDialog={() => {
                setOpen(false);
                setLanguageDialogOpen(true);
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      <LanguageDialog
        open={languageDialogOpen}
        onOpenChange={setLanguageDialogOpen}
        isLoggedIn={state.isLoggedIn}
        title={copy.languageDialogTitle}
      />
    </>
  );
}

function MenuPanel({
  state,
  labels,
  copy,
  hideExploreLinks,
  onNavigate,
  onOpenLanguageDialog,
}: {
  state: PublicAccountMenuState;
  labels: PublicAccountMenuLabels;
  copy: (typeof COPY)["tr"];
  hideExploreLinks: boolean;
  onNavigate?: () => void;
  onOpenLanguageDialog: () => void;
}) {
  const initials = state.name
    ? state.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
    : null;

  return (
    <div className="space-y-6 px-5 py-5">
      {state.isLoggedIn && (state.name || state.email) && (
        <div className="flex items-center gap-3 border-b border-border/70 pb-5">
          <Avatar className="size-11" size="lg">
            {state.avatarUrl && (
              <AvatarImage src={state.avatarUrl} alt={state.name ?? state.email ?? ""} />
            )}
            <AvatarFallback className="text-base">
              {initials || <User className="size-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {state.name && (
              <p className="truncate text-sm font-semibold">{state.name}</p>
            )}
            {state.email && (
              <p className="truncate text-xs text-muted-foreground">{state.email}</p>
            )}
          </div>
        </div>
      )}

      <MenuSection title={copy.customers}>
        {state.isLoggedIn ? (
          <>
            <MenuLink href="/account" icon={<User />} onNavigate={onNavigate}>
              {labels.account}
            </MenuLink>
            <MenuLink href="/account/payments" icon={<CreditCard />} onNavigate={onNavigate}>
              {copy.payments}
            </MenuLink>
            <MenuLink href="/account/settings" icon={<Settings />} onNavigate={onNavigate}>
              {copy.settings}
            </MenuLink>
            <MenuLink href="/help" icon={<HelpCircle />} onNavigate={onNavigate}>
              {copy.help}
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
            <MenuLink href="/business/dashboard" icon={<BriefcaseBusiness />} onNavigate={onNavigate}>
              {copy.switchToBusiness}
            </MenuLink>
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

      {!hideExploreLinks && !state.isLoggedIn && (
        <MenuLink href="/help" icon={<HelpCircle />} onNavigate={onNavigate}>
          {copy.help}
        </MenuLink>
      )}

      <div className="border-t border-border/70 pt-5">
        <button
          type="button"
          onClick={onOpenLanguageDialog}
          className="flex min-h-10 w-full items-center gap-3 rounded-lg px-1 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Globe2 className="size-4 text-foreground" />
          {copy.language}
        </button>
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
