import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { NavbarMobileMenu } from "./navbar-mobile-menu";
import { LocaleSwitcher } from "./locale-switcher";
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={p("/")} className="text-xl font-bold tracking-tight">
          UrGlowUp
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href={p("/explore")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {dict.nav.explore}
          </Link>
          <Link
            href={navLink.href}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {navLink.label}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LocaleSwitcher />
          </div>
          {user ? (
            <UserButton />
          ) : (
            <>
              <SignInButton>
                <Button variant="ghost" size="sm">
                  {dict.nav.signIn}
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">{dict.nav.signUp}</Button>
              </SignUpButton>
            </>
          )}
          <div className="md:hidden">
            <NavbarMobileMenu
              navLink={navLink}
              exploreHref={p("/explore")}
              exploreLabel={dict.nav.explore}
              openMenuLabel={dict.nav.openMenu}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
