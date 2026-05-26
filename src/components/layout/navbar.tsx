import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { NavbarMobileMenu } from "./navbar-mobile-menu";
import { NavLinks } from "./navbar-nav-links";
import { LocaleSwitcher } from "./locale-switcher";
import { NavbarScrollEffect } from "./navbar-scroll-effect";
import { getDictionary } from "@/lib/get-dictionary";
import type { Locale } from "@/lib/i18n-config";

interface NavbarProps {
  locale?: Locale;
}

export async function Navbar({ locale = "tr" }: NavbarProps) {
  const [user, dict] = await Promise.all([
    getCurrentUser(),
    getDictionary(locale),
  ]);

  const p = (path: string) =>
    locale === "tr" ? path : `/${locale}${path}`;

  const navLink = user
    ? user.role === UserRole.BUSINESS_OWNER
      ? { label: dict.nav.businessPanel, href: "/business/dashboard" }
      : user.role === UserRole.ADMIN
        ? { label: dict.nav.adminPanel, href: "/admin" }
        : { label: dict.nav.account, href: "/account" }
    : { label: dict.nav.forBusiness, href: p("/for-business") };

  return (
    <header
      data-navbar
      className="sticky top-0 z-50 w-full border-b border-transparent bg-background
        transition-[background-color,border-color,box-shadow] duration-200
        data-[scrolled=true]:border-border
        data-[scrolled=true]:bg-background/75
        data-[scrolled=true]:backdrop-blur-md
        data-[scrolled=true]:shadow-[var(--shadow-sm)]"
    >
      <NavbarScrollEffect />
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href={p("/")}
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-pink/20">
            <Sparkles className="size-4 text-brand-pink-foreground" />
          </span>
          <span className="text-xl font-bold tracking-tight">UrGlowUp</span>
        </Link>

        <NavLinks
          links={[
            { label: dict.nav.explore, href: p("/explore") },
            navLink,
          ]}
        />

        <div className="flex items-center gap-1.5">
          <div className="hidden md:block">
            <LocaleSwitcher isLoggedIn={!!user} />
          </div>
          {user ? (
            <UserButton />
          ) : (
            <>
              <SignInButton>
                <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                  {dict.nav.signIn}
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button variant="brand" size="sm">{dict.nav.signUp}</Button>
              </SignUpButton>
            </>
          )}
          <div className="md:hidden">
            <NavbarMobileMenu
              navLink={navLink}
              exploreHref={p("/explore")}
              exploreLabel={dict.nav.explore}
              openMenuLabel={dict.nav.openMenu}
              signInLabel={dict.nav.signIn}
              signUpLabel={dict.nav.signUp}
              isLoggedIn={!!user}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
